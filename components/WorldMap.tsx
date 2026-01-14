import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { GeoLocation } from '../types';

interface WorldMapProps {
  locations: GeoLocation[];
  highlightedCountries: string[]; // List of country names or IDs to highlight
  onCountryClick?: (countryName: string) => void;
  onPinDragEnd?: (id: string, lat: number, lng: number) => void;
  editMode?: boolean;
}

const WorldMap: React.FC<WorldMapProps> = ({ locations, highlightedCountries, onCountryClick, onPinDragEnd, editMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        setWorldData(data);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 800;
    const height = 450;

    // Colors
    const mapBackgroundColor = "#1e293b"; // Slate-800
    const defaultCountryColor = "#475569"; // Slate-600
    const highlightColor = "#37A3C3"; // Theme Cyan
    const hoverColor = "#BAE6FD"; // Very Light Blue (Tailwind sky-200)
    const strokeColor = "#334155"; // Slate-700

    const projection = d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const countries = topojson.feature(worldData, worldData.objects.countries) as any;

    // Draw Background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", mapBackgroundColor)
      .attr("rx", 8);

    // Draw Countries
    svg.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const name = d.properties.name;
        if (highlightedCountries.includes(name)) return highlightColor;
        return defaultCountryColor;
      })
      .attr("stroke", strokeColor)
      .attr("stroke-width", 0.5)
      .style("cursor", editMode ? "pointer" : "default")
      // Hover Effects
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition().duration(150)
          .attr("fill", hoverColor)
          .attr("stroke", "#ffffff");
        
        // Tooltip Show
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = "1";
          tooltipRef.current.innerText = d.properties.name;
          tooltipRef.current.style.left = `${event.clientX + 15}px`;
          tooltipRef.current.style.top = `${event.clientY + 15}px`;
        }
      })
      .on("mousemove", function(event) {
        // Tooltip Follow
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${event.clientX + 15}px`;
          tooltipRef.current.style.top = `${event.clientY + 15}px`;
        }
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this)
          .transition().duration(150)
          .attr("fill", () => {
            const name = d.properties.name;
            if (highlightedCountries.includes(name)) return highlightColor;
            return defaultCountryColor;
          })
          .attr("stroke", strokeColor);

        // Tooltip Hide
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = "0";
        }
      })
      .on("click", (event, d: any) => {
        if (editMode && onCountryClick) {
          onCountryClick(d.properties.name);
        }
      });

    // Draw Locations (Pins)
    if (locations.length > 0) {
      const pins = svg.selectAll("circle")
        .data(locations)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lng, d.lat])?.[0] || 0)
        .attr("cy", d => projection([d.lng, d.lat])?.[1] || 0)
        .attr("r", 6)
        .attr("fill", "#ffffff")
        .attr("stroke", highlightColor)
        .attr("stroke-width", 2);

      // Drag Behavior
      if (editMode && onPinDragEnd) {
        const dragBehavior = d3.drag()
          .on("start", function() {
            d3.select(this)
              .raise() // Bring to front
              .attr("stroke", "#ef4444") // Red stroke while dragging
              .attr("cursor", "grabbing");
          })
          .on("drag", function(event) {
            d3.select(this)
              .attr("cx", event.x)
              .attr("cy", event.y);
          })
          .on("end", function(event, d: any) {
            d3.select(this)
              .attr("stroke", highlightColor)
              .attr("cursor", "grab");
            
            const coords = projection.invert?.([event.x, event.y]);
            if (coords) {
              onPinDragEnd(d.id, coords[1], coords[0]); // lat, lng
            }
          });

        pins.call(dragBehavior as any);
        pins.style("cursor", "grab");
      }
      
      // Pin Tooltips
      pins.append("title").text(d => d.name);
    }

  }, [worldData, locations, highlightedCountries, editMode, onCountryClick, onPinDragEnd]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-slate-900">
      <svg 
        ref={svgRef} 
        viewBox="0 0 800 450" 
        className="w-full h-auto block"
      />
      {/* Custom Tooltip Portal */}
      <div 
        ref={tooltipRef}
        className="fixed pointer-events-none bg-slate-800/90 text-white text-xs font-medium px-2 py-1 rounded shadow-lg backdrop-blur-sm border border-slate-600 z-50 opacity-0 transition-opacity duration-150"
        style={{ top: 0, left: 0 }}
      >
      </div>
      
      {editMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 p-2 border-t border-slate-800">
          <p className="text-xs text-slate-400 italic text-center">
            * Click countries to toggle highlight. Drag pins to adjust location.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
