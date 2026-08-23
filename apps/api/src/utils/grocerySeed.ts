// ─────────────────────────────────────────────────────────────
// GROCERY PRODUCT SEED DATA
// 100+ products with current Indian market prices (Aug 2026)
// Categories: Staples, Pulses, Spices, Dairy, Snacks, Beverages,
//   Personal Care, Household, Cooking Essentials, Fruits & Vegetables
// ─────────────────────────────────────────────────────────────

export interface SeedProduct {
  name: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string;
  searchAliases: string;
  description?: string;
}

// Emoji-based product icons (using CDN URLs for clean rendering)
const icon = (emoji: string) => `https://cdn.jsdelivr.net/npm/emoji-datasource@15.0.0/img/twitter/72x72/${emoji}.png`;

export const GROCERY_CATEGORIES = [
  { name: 'Staples & Grains', sortOrder: 0 },
  { name: 'Pulses & Lentils', sortOrder: 1 },
  { name: 'Spices & Masalas', sortOrder: 2 },
  { name: 'Cooking Oils & Ghee', sortOrder: 3 },
  { name: 'Dairy & Eggs', sortOrder: 4 },
  { name: 'Snacks & Biscuits', sortOrder: 5 },
  { name: 'Beverages', sortOrder: 6 },
  { name: 'Packaged Food', sortOrder: 7 },
  { name: 'Personal Care', sortOrder: 8 },
  { name: 'Household & Cleaning', sortOrder: 9 },
  { name: 'Fruits & Vegetables', sortOrder: 10 },
  { name: 'Bakery & Bread', sortOrder: 11 },
  { name: 'Baby Care', sortOrder: 12 },
  { name: 'Stationery & Misc', sortOrder: 13 },
];

export const GROCERY_PRODUCTS: SeedProduct[] = [
  // ═══ STAPLES & GRAINS ═══════════════════════════════════════
  { name: 'Basmati Rice', price: 120, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('rice'), searchAliases: 'basmati,chawal,rice,चावल,চাল' },
  { name: 'Non-Basmati Rice', price: 55, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('rice'), searchAliases: 'rice,kacchi,arwa,plain rice' },
  { name: 'Wheat Atta', price: 48, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('wheat'), searchAliases: 'atta,flour,aata,gehu,गेहूं,আটা' },
  { name: 'Maida (Refined Flour)', price: 42, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('wheat'), searchAliases: 'maida,refined flour,मैदा,ময়দা' },
  { name: 'Sooji (Semolina)', price: 50, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('wheat'), searchAliases: 'sooji,rava,suji,सूजी,সুজি' },
  { name: 'Sugar', price: 48, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('cookie'), searchAliases: 'cheeni,sugar,चीनी,চিনি' },
  { name: 'Salt (Tata)', price: 25, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('salt'), searchAliases: 'namak,salt,noon,नमक,নুন' },
  { name: 'Poha (Flattened Rice)', price: 60, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('rice'), searchAliases: 'poha,chivda,flattened rice,चिवड़া' },
  { name: 'Murmura (Puffed Rice)', price: 40, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('popcorn'), searchAliases: 'murmura,khoja,puffed rice,मुरमुरा' },
  { name: 'Corn Flour', price: 55, unit: 'kg', category: 'Staples & Grains', imageUrl: icon('corn'), searchAliases: 'corn flour,makai ka atta' },
  { name: 'Bread crumbs', price: 80, unit: 'packet', category: 'Staples & Grains', imageUrl: icon('bread'), searchAliases: 'bread crumbs' },
  { name: 'Oats (Quaker)', price: 120, unit: 'packet', category: 'Staples & Grains', imageUrl: icon('owl'), searchAliases: 'oats,oatmeal' },

  // ═══ PULSES & LENTILS ═══════════════════════════════════════
  { name: 'Toor Dal', price: 140, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'toor,tuvar,arhar dal,तूर दाल,তুর ডাল' },
  { name: 'Masoor Dal', price: 110, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'masoor,lentil,red lentil,मसूर दाल,মসুরি ডাল' },
  { name: 'Moong Dal', price: 130, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'moong,green gram,मूंग दाल' },
  { name: 'Chana Dal', price: 95, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'chana,bengal gram,छोला,छोले,छना दाल' },
  { name: 'Urad Dal', price: 150, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'urad,kali dal,black gram' },
  { name: 'Rajma (Kidney Beans)', price: 130, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'rajma,kidney beans,राजमा' },
  { name: 'Kabuli Chana (Chickpeas)', price: 135, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'kabuli chana,chickpeas,chole,काबली छोला' },
  { name: 'Black Chana', price: 80, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'kala chana,black chickpeas' },
  { name: 'Lobia (Black-eyed Peas)', price: 90, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('bean'), searchAliases: 'lobia,black eyed peas' },
  { name: 'Soya Chunks', price: 100, unit: 'kg', category: 'Pulses & Lentils', imageUrl: icon('meat_on_bone'), searchAliases: 'soya chunks,nutrela,soyabean' },

  // ═══ SPICES & MASALAS ═══════════════════════════════════════
  { name: 'Turmeric Powder', price: 180, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'haldi,turmeric,হলুদ' },
  { name: 'Red Chili Powder', price: 200, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('hot_pepper'), searchAliases: 'lal mirch,red chili,মরিচ গুড়া' },
  { name: 'Coriander Powder', price: 180, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'dhaniya powder,coriander' },
  { name: 'Cumin Seeds (Jeera)', price: 300, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'jeera,cumin,जीरा,জিরা' },
  { name: 'Garam Masala', price: 400, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'garam masala,गरम मसला,গরম মসলা' },
  { name: 'Kitchen King Masala', price: 350, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'kitchen king' },
  { name: 'Chaat Masala', price: 300, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'chaat masala' },
  { name: 'Black Pepper', price: 500, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'kali mirch,black pepper' },
  { name: 'Fenugreek Seeds (Methi)', price: 120, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'methi,fenugreek' },
  { name: 'Mustard Seeds (Rai)', price: 100, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'rai,sarson, mustard seeds' },
  { name: 'Asafoetida (Hing)', price: 600, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'hing,asafoetida' },
  { name: 'Bay Leaves (Tej Patta)', price: 200, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('herb'), searchAliases: 'tej patta,bay leaves' },
  { name: 'Cloves (Laung)', price: 800, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'laung,cloves' },
  { name: 'Cinnamon (Dalchini)', price: 500, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'dalchini,cinnamon' },
  { name: 'Cardamom (Elaichi)', price: 1200, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('jar'), searchAliases: 'elaichi,cardamom' },
  { name: 'Black Salt', price: 60, unit: 'kg', category: 'Spices & Masalas', imageUrl: icon('salt'), searchAliases: 'kala namak,black salt' },

  // ═══ COOKING OILS & GHEE ════════════════════════════════════
  { name: 'Mustard Oil', price: 180, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('oil'), searchAliases: 'sarson ka tel,mustard oil,সরিষের তেল' },
  { name: 'Refined Sunflower Oil', price: 140, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('oil'), searchAliases: 'sunflower oil,fortune,refined,রিফাইন,रिफाइंड' },
  { name: 'Cooking Oil (Fortune)', price: 180, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('oil'), searchAliases: 'fortune,cooking oil,तेल' },
  { name: 'Coconut Oil', price: 200, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('coconut'), searchAliases: 'nariyal tel,coconut oil' },
  { name: 'Ghee (Amul)', price: 550, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('butter'), searchAliases: 'ghee,amul ghee,घी,ঘি' },
  { name: 'Olive Oil', price: 450, unit: 'litre', category: 'Cooking Oils & Ghee', imageUrl: icon('oil'), searchAliases: 'olive oil' },
  { name: 'Vanaspati (Dalda)', price: 100, unit: 'kg', category: 'Cooking Oils & Ghee', imageUrl: icon('butter'), searchAliases: 'vanaspati,dalda' },

  // ═══ DAIRY & EGGS ═══════════════════════════════════════════
  { name: 'Amul Milk', price: 28, unit: 'litre', category: 'Dairy & Eggs', imageUrl: icon('milk_bottle'), searchAliases: 'milk,amul,dudh,दूধ,দুধ' },
  { name: 'Amul Butter', price: 55, unit: 'packet', category: 'Dairy & Eggs', imageUrl: icon('butter'), searchAliases: 'butter,amul butter,makhan' },
  { name: 'Paneer', price: 80, unit: 'piece', category: 'Dairy & Eggs', imageUrl: icon('cheese'), searchAliases: 'paneer,cottage cheese,पनीর,পনির' },
  { name: 'Curd (Amul)', price: 45, unit: 'packet', category: 'Dairy & Eggs', imageUrl: icon('ice_cream'), searchAliases: 'curd,dahi,yogurt,दही,দই' },
  { name: 'Cheese Slices', price: 120, unit: 'packet', category: 'Dairy & Eggs', imageUrl: icon('cheese'), searchAliases: 'cheese,cheese slice' },
  { name: 'Cream (Amul)', price: 60, unit: 'packet', category: 'Dairy & Eggs', imageUrl: icon('ice_cream'), searchAliases: 'cream,fresh cream' },
  { name: 'Lassi', price: 30, unit: 'packet', category: 'Dairy & Eggs', imageUrl: icon('milk_bottle'), searchAliases: 'lassi' },
  { name: 'Eggs (Brown)', price: 8, unit: 'piece', category: 'Dairy & Eggs', imageUrl: icon('egg'), searchAliases: 'eggs,anda,अंडा' },
  { name: 'Eggs (White)', price: 7, unit: 'piece', category: 'Dairy & Eggs', imageUrl: icon('egg'), searchAliases: 'white eggs' },

  // ═══ SNACKS & BISCUITS ══════════════════════════════════════
  { name: 'Parle-G Biscuits', price: 10, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'parle g,parleg,पारले जी,পারলেজি' },
  { name: 'Maggi Noodles (70g)', price: 14, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('spaghetti'), searchAliases: 'maggi,noodles,मैगी,ম্যাগি' },
  { name: "Lay's Chips (Classic)", price: 20, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('crystal_ball'), searchAliases: 'lays,chips,lays chips,लेस' },
  { name: 'Kurkure', price: 20, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('popcorn'), searchAliases: 'kurkure' },
  { name: 'Haldiram Aloo Bhujia', price: 40, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('popcorn'), searchAliases: 'haldiram,bhujia,aloo bhujia' },
  { name: 'Namkeen Mixture', price: 50, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('popcorn'), searchAliases: 'namkeen,mixture' },
  { name: 'Marie Gold Biscuit', price: 25, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'marie gold,marie biscuit' },
  { name: 'Good Day Biscuit', price: 30, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'good day,britannia' },
  { name: 'Monaco Biscuit', price: 15, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'monaco' },
  { name: 'Uncle Chips', price: 20, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('crystal_ball'), searchAliases: 'uncle chips' },
  { name: 'Rusks', price: 35, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'rusk,rusk toast' },
  { name: 'Khari Biscuit', price: 30, unit: 'packet', category: 'Snacks & Biscuits', imageUrl: icon('cookie'), searchAliases: 'khari' },

  // ═══ BEVERAGES ══════════════════════════════════════════════
  { name: 'Tata Tea Gold', price: 130, unit: 'packet', category: 'Beverages', imageUrl: icon('tea'), searchAliases: 'tata tea,tea,tata gold,चाय पत्ती,টাটা চা' },
  { name: 'Brooke Bond Red Label', price: 180, unit: 'packet', category: 'Beverages', imageUrl: icon('tea'), searchAliases: 'red label,brooke bond' },
  { name: 'Nescafe Classic', price: 175, unit: 'packet', category: 'Beverages', imageUrl: icon('coffee'), searchAliases: 'nescafe,coffee,nescafe classic,नेसक्याफे' },
  { name: 'Bournvita', price: 250, unit: 'packet', category: 'Beverages', imageUrl: icon('coffee'), searchAliases: 'bournvita,chocolate drink' },
  { name: 'Complan', price: 200, unit: 'packet', category: 'Beverages', imageUrl: icon('baby_bottle'), searchAliases: 'complan' },
  { name: 'Horlicks', price: 220, unit: 'packet', category: 'Beverages', imageUrl: icon('coffee'), searchAliases: 'horlicks' },
  { name: 'Boost', price: 200, unit: 'packet', category: 'Beverages', imageUrl: icon('coffee'), searchAliases: 'boost' },
  { name: 'Frooti (Pack)', price: 40, unit: 'packet', category: 'Beverages', imageUrl: icon('tropical_drink'), searchAliases: 'frooti,mango drink' },
  { name: 'Real Fruit Juice (Orange)', price: 60, unit: 'packet', category: 'Beverages', imageUrl: icon('orange_juice'), searchAliases: 'real juice,orange juice' },
  { name: 'Coca Cola (1L)', price: 40, unit: 'piece', category: 'Beverages', imageUrl: icon('cup_with_straw'), searchAliases: 'coke,coca cola,thums up' },
  { name: 'Bisleri Water (1L)', price: 20, unit: 'piece', category: 'Beverages', imageUrl: icon('water_bottle'), searchAliases: 'bisleri,water,pani' },

  // ═══ PACKAGED FOOD ══════════════════════════════════════════
  { name: 'Atta Noodles (Yippee)', price: 14, unit: 'packet', category: 'Packaged Food', imageUrl: icon('spaghetti'), searchAliases: 'yippee,noodles' },
  { name: 'Pasta (Maggi)', price: 40, unit: 'packet', category: 'Packaged Food', imageUrl: icon('spaghetti'), searchAliases: 'pasta' },
  { name: 'Ketchup (Kissan)', price: 60, unit: 'packet', category: 'Packaged Food', imageUrl: icon('tomato'), searchAliases: 'ketchup,kissan,sauce' },
  { name: 'Pickle (Kissan Mango)', price: 80, unit: 'packet', category: 'Packaged Food', imageUrl: icon('jar'), searchAliases: 'pickle,achaar,kissan' },
  { name: 'Papad (Lijjat)', price: 50, unit: 'packet', category: 'Packaged Food', imageUrl: icon('cookie'), searchAliases: 'papad,lijjat' },
  { name: 'Honey (Dabur)', price: 150, unit: 'packet', category: 'Packaged Food', imageUrl: icon('honey_pot'), searchAliases: 'honey,dabur' },
  { name: 'Jam (Kissan)', price: 70, unit: 'packet', category: 'Packaged Food', imageUrl: icon('jar'), searchAliases: 'jam,kissan jam' },
  { name: 'Custard Powder', price: 60, unit: 'packet', category: 'Packaged Food', imageUrl: icon('ice_cream'), searchAliases: 'custard' },
  { name: 'Vermicelli (Seviyan)', price: 40, unit: 'packet', category: 'Packaged Food', imageUrl: icon('spaghetti'), searchAliases: 'seviyan,vermicelli' },

  // ═══ PERSONAL CARE ══════════════════════════════════════════
  { name: 'Colgate Toothpaste', price: 65, unit: 'packet', category: 'Personal Care', imageUrl: icon('toothbrush'), searchAliases: 'colgate,toothpaste,कलगेट,কলগেট' },
  { name: 'Lifebuoy Soap', price: 38, unit: 'piece', category: 'Personal Care', imageUrl: icon('soap'), searchAliases: 'lifebuoy,soap,sabun,लाइफबॉय,লাইবয়' },
  { name: 'Surf Excel Detergent', price: 130, unit: 'packet', category: 'Personal Care', imageUrl: icon('sparkles'), searchAliases: 'surf excel,surf,detergent,सारफ,সারফ' },
  { name: 'Vim Dishwash Liquid', price: 99, unit: 'bottle', category: 'Personal Care', imageUrl: icon('soap'), searchAliases: 'vim,dishwash,भीम' },
  { name: 'Head & Shoulders Shampoo', price: 210, unit: 'piece', category: 'Personal Care', imageUrl: icon('shampoo'), searchAliases: 'shampoo,head shoulders' },
  { name: 'Pantene Shampoo', price: 180, unit: 'piece', category: 'Personal Care', imageUrl: icon('shampoo'), searchAliases: 'pantene,shampoo' },
  { name: 'Dettol Handwash', price: 120, unit: 'piece', category: 'Personal Care', imageUrl: icon('soap'), searchAliases: 'dettol,handwash' },
  { name: 'Vaseline Petroleum Jelly', price: 75, unit: 'piece', category: 'Personal Care', imageUrl: icon('jar'), searchAliases: 'vaseline,jelly' },
  { name: 'Vim Bar (Dishwash)', price: 15, unit: 'piece', category: 'Personal Care', imageUrl: icon('soap'), searchAliases: 'vim bar,vim soap' },
  { name: 'Harpic Toilet Cleaner', price: 85, unit: 'piece', category: 'Personal Care', imageUrl: icon('toilet'), searchAliases: 'harpic,toilet cleaner,हारपिक,হারপিক' },

  // ═══ HOUSEHOLD & CLEANING ════════════════════════════════════
  { name: 'Garbage Bags (Roll)', price: 50, unit: 'packet', category: 'Household & Cleaning', imageUrl: icon('wastebasket'), searchAliases: 'garbage bags, dustbin bags' },
  { name: 'Phenyl (Lizol)', price: 90, unit: 'bottle', category: 'Household & Cleaning', imageUrl: icon('beers'), searchAliases: 'lizol,phenyl,floor cleaner' },
  { name: 'Carbolic Acid', price: 40, unit: 'bottle', category: 'Household & Cleaning', imageUrl: icon('beers'), searchAliases: 'carbolic' },
  { name: 'Matchbox', price: 5, unit: 'piece', category: 'Household & Cleaning', imageUrl: icon('fire'), searchAliases: 'machis,matchbox,माचिस' },
  { name: 'Candles (Pack)', price: 20, unit: 'packet', category: 'Household & Cleaning', imageUrl: icon('candle'), searchAliases: 'candle,mombatti' },
  { name: 'Aluminium Foil', price: 60, unit: 'packet', category: 'Household & Cleaning', imageUrl: icon('cooking'), searchAliases: 'foil,aluminium foil' },
  { name: 'Clips (Clothes)', price: 30, unit: 'packet', category: 'Household & Cleaning', imageUrl: icon('pushpin'), searchAliases: 'clothes clips,capstan' },
  { name: 'String / Dori', price: 15, unit: 'piece', category: 'Household & Cleaning', imageUrl: icon('knot'), searchAliases: 'dori,string,rope' },

  // ═══ FRUITS & VEGETABLES ════════════════════════════════════
  { name: 'Onion', price: 40, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('onion'), searchAliases: 'pyaz,onion,प्याज,পেঁয়াজ' },
  { name: 'Potato', price: 35, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('potato'), searchAliases: 'aloo,potato,आलू,আলু' },
  { name: 'Tomato', price: 40, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('tomato'), searchAliases: 'tamatar,tomato,टमाटर,টমেটো' },
  { name: 'Ginger', price: 120, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('ginger'), searchAliases: 'adrak,ginger,अदरক,আদা' },
  { name: 'Garlic', price: 100, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('garlic'), searchAliases: 'lahsun,garlic,रसुन,রসুন' },
  { name: 'Green Chili', price: 80, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('hot_pepper'), searchAliases: 'hari mirch,green chili,काँचा मরिच,কাঁচা মরিচ' },
  { name: 'Lemon', price: 5, unit: 'piece', category: 'Fruits & Vegetables', imageUrl: icon('lemon'), searchAliases: 'nimbu,lemon,लेमन,লেবু' },
  { name: 'Apple', price: 120, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('apple'), searchAliases: 'apple,seb' },
  { name: 'Banana', price: 50, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('banana'), searchAliases: 'banana,kela' },
  { name: 'Orange', price: 80, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('tangerine'), searchAliases: 'orange,santra' },
  { name: 'Cauliflower', price: 40, unit: 'piece', category: 'Fruits & Vegetables', imageUrl: icon('broccoli'), searchAliases: 'gobhi,cauliflower,phool gobhi' },
  { name: 'Cabbage', price: 35, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('broccoli'), searchAliases: 'patta gobhi,cabbage' },
  { name: 'Peas (Matar)', price: 60, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('pea_pod'), searchAliases: 'matar,peas,green peas' },
  { name: 'Carrot', price: 40, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('carrot'), searchAliases: 'gajar,carrot' },
  { name: 'Cucumber', price: 30, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('cucumber'), searchAliases: 'kheera,cucumber' },
  { name: 'Lady Finger (Bhindi)', price: 60, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('pea_pod'), searchAliases: 'bhindi,lady finger,okra' },
  { name: 'Bottle Gourd (Lauki)', price: 30, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('pea_pod'), searchAliases: 'lauki,bottle gourd,doodhi' },
  { name: 'Bitter Gourd (Karela)', price: 50, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('pea_pod'), searchAliases: 'karela,bitter gourd' },
  { name: 'Brinjal (Baingan)', price: 40, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('eggplant'), searchAliases: 'baingan,brinjal,eggplant' },
  { name: 'Capsicum (Shimla Mirch)', price: 60, unit: 'kg', category: 'Fruits & Vegetables', imageUrl: icon('hot_pepper'), searchAliases: 'capsicum,shimla mirch,bell pepper' },

  // ═══ BAKERY & BREAD ═════════════════════════════════════════
  { name: 'White Bread', price: 40, unit: 'packet', category: 'Bakery & Bread', imageUrl: icon('bread'), searchAliases: 'bread,white bread' },
  { name: 'Brown Bread', price: 50, unit: 'packet', category: 'Bakery & Bread', imageUrl: icon('bread'), searchAliases: 'brown bread,whole wheat bread' },
  { name: 'Pav (Bread Rolls)', price: 30, unit: 'packet', category: 'Bakery & Bread', imageUrl: icon('bread'), searchAliases: 'pav,bun' },
  { name: 'Cake Rusk', price: 40, unit: 'packet', category: 'Bakery & Bread', imageUrl: icon('cookie'), searchAliases: 'cake rusk' },
  { name: 'Milk Bread', price: 45, unit: 'packet', category: 'Bakery & Bread', imageUrl: icon('bread'), searchAliases: 'milk bread' },

  // ═══ BABY CARE ══════════════════════════════════════════════
  { name: 'Diapers (MamyPoko)', price: 300, unit: 'packet', category: 'Baby Care', imageUrl: icon('baby'), searchAliases: 'diapers,mamypoko' },
  { name: 'Baby Soap (Johnson)', price: 80, unit: 'piece', category: 'Baby Care', imageUrl: icon('baby'), searchAliases: 'baby soap,johnson' },
  { name: 'Baby Powder (Johnson)', price: 90, unit: 'piece', category: 'Baby Care', imageUrl: icon('baby'), searchAliases: 'baby powder,johnson powder' },

  // ═══ STATIONERY & MISC ══════════════════════════════════════
  { name: 'Pen (Reynolds)', price: 10, unit: 'piece', category: 'Stationery & Misc', imageUrl: icon('pencil'), searchAliases: 'pen,reynolds' },
  { name: 'Notebook (Classmate)', price: 40, unit: 'piece', category: 'Stationery & Misc', imageUrl: icon('notebook'), searchAliases: 'notebook,classmate' },
  { name: 'Batteries (AA)', price: 80, unit: 'packet', category: 'Stationery & Misc', imageUrl: icon('battery'), searchAliases: 'battery,aa battery' },
  { name: 'Polythene Bags', price: 20, unit: 'packet', category: 'Stationery & Misc', imageUrl: icon('wastebasket'), searchAliases: 'polythene,carry bag' },
];

// ─── SEED FUNCTION ───────────────────────────────────────────
export async function seedGroceryProducts(
  prisma: any,
  storeId: string
): Promise<{ categoriesCreated: number; productsCreated: number }> {
  let categoriesCreated = 0;
  let productsCreated = 0;

  // Create categories
  const catMap: Record<string, string> = {};
  for (const cat of GROCERY_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { storeId, name: cat.name },
    });
    if (existing) {
      catMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: cat.name, storeId, sortOrder: cat.sortOrder, isActive: true },
      });
      catMap[cat.name] = created.id;
      categoriesCreated++;
    }
  }

  // Create products (skip duplicates)
  const existingProducts = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: { name: true },
  });
  const existingNames = new Set(existingProducts.map((p: any) => p.name.toLowerCase()));

  for (const product of GROCERY_PRODUCTS) {
    if (existingNames.has(product.name.toLowerCase())) continue;

    await prisma.product.create({
      data: {
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        categoryId: catMap[product.category] || null,
        storeId,
        isAvailable: true,
        isActive: true,
        searchAliases: product.searchAliases,
        description: product.description || null,
      },
    });
    productsCreated++;
  }

  return { categoriesCreated, productsCreated };
}
