const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function seed() {
  try {
    // 1. Fetch categories
    const { data: categories } = await axios.get(`${API_URL}/categories`);
    
    const getCatId = async (name) => {
      let c = categories.find(c => c.name === name);
      if (!c) {
        console.log('Creating category', name);
        const res = await axios.post(`${API_URL}/categories`, { name, description: '' });
        return res.data._id;
      }
      return c._id;
    };

    const banglesId = await getCatId('Bangles');
    const flowersId = await getCatId('Artificial Flowers');
    const giftboxesId = await getCatId('Gift Box Combo');
    const jumkhasId = await getCatId('Jumkhas');
    const jewelsId = await getCatId('Jewels');

    // 2. Fetch subcategories
    const { data: subcategories } = await axios.get(`${API_URL}/subcategories`);

    const getSubId = async (name, catId) => {
      let s = subcategories.find(s => s.name === name);
      if (!s) {
        console.log('Creating subcategory', name);
        const res = await axios.post(`${API_URL}/subcategories`, { name, category: catId, description: '' });
        return res.data._id;
      }
      return s._id;
    };

    const bangleSubs = ['Glass Bangles', 'Valaikaappu Bangles', 'Antique Bangles', 'Wedding Bangles'];
    const flowerSubs = ['Rose Garlands', 'Jasmine Strings', 'Veni', 'Bridal Gajra'];

    let count = 0;

    for (const sub of bangleSubs) {
      const subId = await getSubId(sub, banglesId);
      for (let i = 1; i <= 4; i++) {
        await axios.post(`${API_URL}/products`, {
          name: `Premium ${sub} - Style ${i}`,
          description: 'Exquisite handcrafted bangles for all your special occasions.',
          price: 499 + (i * 100),
          originalPrice: 499 + (i * 100) + 200,
          category: 'Bangles',
          subcategoryId: subId,
          inStock: true,
          sizes: [{size: '2.2', order: 1}, {size: '2.4', order: 2}, {size: '2.6', order: 3}, {size: '2.8', order: 4}],
          isOffer: i === 1,
          offerPrice: i === 1 ? 399 : undefined
        });
        count++;
      }
    }

    for (const sub of flowerSubs) {
      const subId = await getSubId(sub, flowersId);
      for (let i = 1; i <= 4; i++) {
        await axios.post(`${API_URL}/products`, {
          name: `Elegant ${sub} - Style ${i}`,
          description: 'Beautiful artificial flowers that look just like the real ones.',
          price: 299 + (i * 50),
          originalPrice: 299 + (i * 50) + 100,
          category: 'Artificial Flowers',
          subcategoryId: subId,
          inStock: true,
          isOffer: i === 2,
          offerPrice: i === 2 ? 199 : undefined
        });
        count++;
      }
    }

    for (let i = 1; i <= 4; i++) {
      await axios.post(`${API_URL}/products`, {
        name: `Luxury Gift Box Combo - ${i}`,
        description: 'The perfect gift box combo curated with love and elegance.',
        giftBoxDetails: '1x Statement Necklace\n1x Pair of Matching Earrings\n1x Beautiful Veni\n1x Handcrafted Bangle Set',
        price: 999 + (i * 200),
        originalPrice: 999 + (i * 200) + 500,
        category: 'Gift Box Combo',
        inStock: true,
        isOffer: i === 3,
        offerPrice: i === 3 ? 899 : undefined
      });
      count++;
    }

    for (let i = 1; i <= 4; i++) {
      await axios.post(`${API_URL}/products`, {
        name: `Traditional Jumkha - Design ${i}`,
        description: 'Stunning jumkhas to match your ethnic wear perfectly.',
        price: 349 + (i * 150),
        originalPrice: 349 + (i * 150) + 100,
        category: 'Jumkhas',
        inStock: true,
        isOffer: i === 4,
        offerPrice: i === 4 ? 299 : undefined
      });
      count++;
    }

    for (let i = 1; i <= 4; i++) {
      await axios.post(`${API_URL}/products`, {
        name: `Royal Jewels Set - ${i}`,
        description: 'A masterpiece jewelry set to make you feel like royalty.',
        price: 1499 + (i * 500),
        originalPrice: 1499 + (i * 500) + 500,
        category: 'Jewels',
        inStock: true,
        isOffer: i === 1,
        offerPrice: i === 1 ? 1299 : undefined
      });
      count++;
    }

    console.log(`Successfully added ${count} products.`);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

seed();
