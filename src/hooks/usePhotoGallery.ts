
import React, {useState,useEffect} from 'react';
import { useCamera } from '@ionic/react-hooks/camera';
import { useFilesystem, base64FromPath } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import { isPlatform } from '@ionic/react';
import { CameraResultType, CameraSource, CameraPhoto, Capacitor, FilesystemDirectory } from "@capacitor/core";

const PHOTO_STORAGE = "photos";

export function usePhotoGallery() {
  //https://capacitor.ionicframework.com/docs/apis/camera/
    const { getPhoto } = useCamera(); //react-hook , llama a la api de capacitor 
    const { get, set } = useStorage(); //
    const { deleteFile, getUri, readFile, writeFile } = useFilesystem();
    
    //Usamos UseState del API de react para almacenar en el array "photos", cada foto sacada.
    const [photos, setPhotos] = useState<Photo[]>([]); //Interface <Photo
    
    //Usamos UseEffect del API de react para descargar las photos guardas cada vez que el componente camara se actualiza.
    useEffect(() => {
      const loadSaved = async () => {
        const photosString = await get('photos');
        const photos = (photosString ? JSON.parse(photosString) : []) as Photo[];
        for (let photo of photos) {
          const file = await readFile({
            path: photo.filepath,
            directory: FilesystemDirectory.Data
          });
          photo.base64 = `data:image/jpeg;base64,${file.data}`;
        }
        setPhotos(photos);
      };
      loadSaved();
    }, [get, readFile]);


    const takePhoto = async () => {
        const cameraPhoto = await getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          quality: 100
        });
        const fileName = new Date().getTime() + '.jpeg';
        const savedFileImage = await savePicture(cameraPhoto, fileName);
        const newPhotos = [savedFileImage, ...photos];
        setPhotos(newPhotos);

        set(PHOTO_STORAGE, JSON.stringify(newPhotos.map(p => {
          // Don't save the base64 representation of the photo data, 
          // since it's already saved on the Filesystem
          const photoCopy = { ...p };
          delete photoCopy.base64;
          return photoCopy;
        })));
        console.log("PHOTO_STORAGE",PHOTO_STORAGE);

      };

      const savePicture = async (photo: CameraPhoto, fileName: string) => {
        const base64Data = await base64FromPath(photo.webPath!);
        await writeFile({
          path: fileName,
          data: base64Data,
          directory: FilesystemDirectory.Data
        });
        return getPhotoFile(photo, fileName);
      };
      
      const getPhotoFile = async (cameraPhoto: CameraPhoto, fileName: string): Promise<Photo> => {
        return {
          filepath: fileName,
          webviewPath: cameraPhoto.webPath
        };
      };
      
      return {
        photos,
        takePhoto
      };
    }

export interface Photo {
    filepath: string;
    webviewPath?: string;
    base64?: string;
}