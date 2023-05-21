import axios from "axios";

// export const URL = "http://localhost:8000";
export const URL = "https://donia-ahmedsamir122.vercel.app";
export const getWishList = (url, token) => {
  return axios.get(url, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const updateFileData = (url, data, token) => {
  return axios.patch(url, data, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const postDataProtect = (url, data, token) => {
  return axios.post(url, data, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const deleteDataProtect = (url, data, token) => {
  return axios.delete(url, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updatePhotoData = (url, data, token) => {
  return axios.patch(url, data, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
