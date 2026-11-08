import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Converts a file to a compressed data URL using client-side canvas
 */
export const fileToCompressedDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 900; // max dimension for ultra-fast load and lightweight footprint

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file to Firebase Storage with automatic fast fallback to compressed Data URL
 * if Storage is offline, restricted, or taking too long.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'rooms/101/image.jpg')
 * @returns The download URL or data URL
 */
export const uploadMedia = async (file: File, path: string): Promise<string> => {
  // First prepare the fast client-side compressed Data URL
  const dataUrl = await fileToCompressedDataUrl(file);

  if (!storage) {
    return dataUrl;
  }

  // Attempt Firebase Storage with a 3-second safety race timeout
  try {
    const storagePromise = (async () => {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Storage upload timeout")), 3000)
    );

    return await Promise.race([storagePromise, timeoutPromise]);
  } catch (error) {
    console.warn("Firebase Storage upload note (using optimized media payload):", error);
    return dataUrl;
  }
};

/**
 * Deletes a file from Firebase Storage safely
 * @param url The full URL of the file to delete
 */
export const deleteMedia = async (url: string): Promise<void> => {
  if (!url || url.startsWith('data:')) {
    return; // Nothing to delete from storage if data URL
  }
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Media deletion note (local reference removed):", error);
  }
};
