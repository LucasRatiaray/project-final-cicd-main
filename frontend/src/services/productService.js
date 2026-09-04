import axios from 'axios';

const API_URL = '/api/products';

export const productService = {
  async getProducts() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
};
