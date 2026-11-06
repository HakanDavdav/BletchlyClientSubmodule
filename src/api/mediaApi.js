import api from './axios'

export const mediaApi = {
  uploadImage: ({ file, kind, crop, rotation = 0 }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind === 'card' ? 'Card' : 'Avatar');
    formData.append('cropX', String((crop?.x ?? 0) / 100));
    formData.append('cropY', String((crop?.y ?? 0) / 100));
    formData.append('cropWidth', String((crop?.width ?? 100) / 100));
    formData.append('cropHeight', String((crop?.height ?? 100) / 100));
    formData.append('rotation', String(rotation));

    return api.post('/media/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
