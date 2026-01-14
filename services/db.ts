import { Company } from '../types';
import { INITIAL_COMPANIES_LIST, createEmptyCompany } from '../constants';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDgH7lMGJ1ZP10vHNGG6aiIQA6xPqLDsFg",
  authDomain: "egcav4.firebaseapp.com",
  projectId: "egcav4",
  storageBucket: "egcav4.firebasestorage.app",
  messagingSenderId: "160448591172",
  appId: "1:160448591172:web:fd05d35d104c7fd1d15311",
  measurementId: "G-D77E0ZL63W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const DB_KEY = 'egca_outreach_db_v1'; // Keep for migration checking

// --- Firestore Operations ---

export const getCompanies = async (): Promise<Company[]> => {
  const snapshot = await getDocs(collection(db, "companies"));
  const companies: Company[] = [];
  snapshot.forEach((doc) => {
    companies.push(doc.data() as Company);
  });
  return companies;
};

export const getCompanyById = async (id: string): Promise<Company | undefined> => {
  const docRef = doc(db, "companies", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Company;
  }
  return undefined;
};

export const saveCompany = async (updatedCompany: Company): Promise<void> => {
  await setDoc(doc(db, "companies", updatedCompany.id), updatedCompany);
};

export const addCompany = async (name: string): Promise<Company> => {
  const newCompany = createEmptyCompany(name);
  await setDoc(doc(db, "companies", newCompany.id), newCompany);
  return newCompany;
};

export const deleteCompany = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "companies", id));
}

// --- Storage Operations ---

// Helper to compress images
const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject(new Error("Canvas not available"));
            }

            // Reasonable max dimensions to prevent huge canvases
            const MAX_DIM = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_DIM) {
                height *= MAX_DIM / width;
                width = MAX_DIM;
            } else if (height > MAX_DIM) {
                width *= MAX_DIM / height;
                height = MAX_DIM;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.5 quality (50%)
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error("Compression failed"));
            }, 'image/jpeg', 0.5);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
    });
};

/**
 * Uploads a File object to Firebase Storage with metadata.
 * Automatically compresses images by 50%.
 */
export const uploadImageFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  
  let blobToUpload: Blob = file;
  let contentType = file.type;

  // Compress if it is an image
  if (file.type.startsWith('image/')) {
     try {
         blobToUpload = await compressImage(file);
         contentType = 'image/jpeg'; // converted to jpeg
     } catch (e) {
         console.warn("Compression failed, uploading original.", e);
     }
  }

  // Important: Set contentType so the browser knows how to display it
  const metadata = {
    contentType: contentType
  };
  await uploadBytes(storageRef, blobToUpload, metadata);
  return await getDownloadURL(storageRef);
};

/**
 * Uploads a Base64 string to Firebase Storage (Used for migration)
 */
export const uploadBase64Image = async (base64String: string, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  // data_url automatically sets the content type
  await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(storageRef);
};

// --- Migration Tooling ---

export const hasLocalData = (): boolean => {
  const stored = localStorage.getItem(DB_KEY);
  return !!stored;
}

export const migrateLocalDataToFirebase = async (onProgress: (msg: string) => void): Promise<void> => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) throw new Error("No local data found.");

  const localCompanies: Company[] = JSON.parse(stored);
  
  for (let i = 0; i < localCompanies.length; i++) {
    const company = localCompanies[i];
    onProgress(`Migrating ${company.name} (${i + 1}/${localCompanies.length})...`);

    // 1. Handle Logo
    if (company.logoUrl && company.logoUrl.startsWith('data:')) {
      try {
        const url = await uploadBase64Image(company.logoUrl, `companies/${company.id}/logo.png`);
        company.logoUrl = url;
      } catch (e) {
        console.error(`Failed to upload logo for ${company.name}`, e);
      }
    }

    // 2. Handle Executives Images
    for (const exec of company.executives) {
      if (exec.imageUrl && exec.imageUrl.startsWith('data:')) {
         try {
            const url = await uploadBase64Image(exec.imageUrl, `companies/${company.id}/executives/${exec.id}.png`);
            exec.imageUrl = url;
         } catch (e) {
            console.error(`Failed to upload exec image for ${exec.name}`, e);
         }
      }
    }

    // 3. Save to Firestore
    await saveCompany(company);
  }

  onProgress("Migration complete! You can now delete local data.");
};

export const clearLocalData = () => {
  localStorage.removeItem(DB_KEY);
};

// Kept for backward compatibility if needed, but updated to use Firestore logic inside components
// Not used directly in new async flow
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};