import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GrocGo database...');

  // Create super admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grocgo.com' },
    update: {},
    create: {
      name: 'GrocGo Admin',
      email: 'admin@grocgo.com',
      passwordHash: adminPassword,
      phone: '+919000000000',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`  ✅ Super admin: ${admin.email}`);

  // Create demo store
  const demoStore = await prisma.store.upsert({
    where: { slug: 'demo-kirana-store' },
    update: {},
    create: {
      name: 'Sharma Kirana Store',
      slug: 'demo-kirana-store',
      address: '123 Main Road, Near Bus Stand',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: '+919876543210',
      email: 'sharma.kirana@example.com',
      description: 'Your neighbourhood grocery store since 1995',
      businessHours: '{"mon":"8-21","tue":"8-21","wed":"8-21","thu":"8-21","fri":"8-21","sat":"8-21","sun":"9-14"}',
    },
  });

  // Create shopkeeper for demo store
  const shopkeeper = await prisma.user.upsert({
    where: { email: 'shopkeeper@example.com' },
    update: {},
    create: {
      name: 'Rajesh Sharma',
      email: 'shopkeeper@example.com',
      passwordHash: adminPassword,
      phone: '+919876543210',
      role: 'SHOPKEEPER',
      storeId: demoStore.id,
    },
  });
  console.log(`  ✅ Shopkeeper: ${shopkeeper.email}`);

  // Create subscription
  await prisma.subscription.upsert({
    where: { storeId: demoStore.id },
    update: {},
    create: { storeId: demoStore.id, plan: 'pro', maxOrders: 1000, maxProducts: 500, maxCustomers: 5000 },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Staples & Grains', storeId: demoStore.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Pulses & Lentils', storeId: demoStore.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Cooking Essentials', storeId: demoStore.id, sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Spices & Masalas', storeId: demoStore.id, sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Dairy & Eggs', storeId: demoStore.id, sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Snacks & Beverages', storeId: demoStore.id, sortOrder: 6 } }),
    prisma.category.create({ data: { name: 'Personal Care', storeId: demoStore.id, sortOrder: 7 } }),
    prisma.category.create({ data: { name: 'Household', storeId: demoStore.id, sortOrder: 8 } }),
  ]);
  console.log(`  ✅ ${categories.length} categories created`);

  // Create products
  const products = [
    // Staples & Grains
    { name: 'Basmati Rice', price: 120, unit: 'kg', categoryId: categories[0].id, sku: 'STP-RICE-001', searchAliases: 'chawal,rice' },
    { name: 'Wheat Atta', price: 55, unit: 'kg', categoryId: categories[0].id, sku: 'STP-ATTA-001', searchAliases: 'atta,flour,gehu' },
    { name: 'Maida (Refined Flour)', price: 45, unit: 'kg', categoryId: categories[0].id, sku: 'STP-MAIDA-001', searchAliases: 'maida,refined flour' },
    { name: 'Poha (Flattened Rice)', price: 60, unit: 'kg', categoryId: categories[0].id, sku: 'STP-POHA-001', searchAliases: 'poha,chivda,flattened rice' },
    { name: 'Suji (Semolina)', price: 40, unit: 'kg', categoryId: categories[0].id, sku: 'STP-SUJI-001', searchAliases: 'suji,rava,semolina' },

    // Pulses & Lentils
    { name: 'Toor Dal', price: 140, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-TOOR-001', searchAliases: 'toor dal,arhar dal' },
    { name: 'Chana Dal', price: 100, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-CHANA-001', searchAliases: 'chana dal,bengal gram' },
    { name: 'Moong Dal', price: 120, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-MOONG-001', searchAliases: 'moong dal,green gram' },
    { name: 'Masoor Dal', price: 110, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-MASOOR-001', searchAliases: 'masoor dal,red lentil' },
    { name: 'Rajma (Kidney Beans)', price: 150, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-RAJMA-001', searchAliases: 'rajma,kidney beans' },
    { name: 'Kabuli Chana', price: 130, unit: 'kg', categoryId: categories[1].id, sku: 'PLS-KCHANA-001', searchAliases: 'kabuli chana,chickpeas,chole' },

    // Cooking Essentials
    { name: 'Mustard Oil', price: 180, unit: 'litre', categoryId: categories[2].id, sku: 'COOK-MUST-001', searchAliases: 'mustard oil,sarson tel' },
    { name: 'Sunflower Oil', price: 150, unit: 'litre', categoryId: categories[2].id, sku: 'COOK-SUN-001', searchAliases: 'sunflower oil' },
    { name: 'Ghee (Amul)', price: 550, unit: 'litre', categoryId: categories[2].id, sku: 'COOK-GHEE-001', searchAliases: 'ghee,clarified butter' },
    { name: 'Sugar', price: 45, unit: 'kg', categoryId: categories[2].id, sku: 'COOK-SUGAR-001', searchAliases: 'sugar,cheeni' },
    { name: 'Salt (Tata)', price: 25, unit: 'kg', categoryId: categories[2].id, sku: 'COOK-SALT-001', searchAliases: 'salt,namak' },

    // Spices & Masalas
    { name: 'Turmeric Powder (Haldi)', price: 200, unit: 'kg', categoryId: categories[3].id, sku: 'SPC-HALD-001', searchAliases: 'haldi,turmeric' },
    { name: 'Red Chilli Powder', price: 250, unit: 'kg', categoryId: categories[3].id, sku: 'SPC-CHILLI-001', searchAliases: 'mirch,red chilli' },
    { name: 'Coriander Powder', price: 180, unit: 'kg', categoryId: categories[3].id, sku: 'SPC-DHANIA-001', searchAliases: 'dhania,coriander' },
    { name: 'Garam Masala', price: 400, unit: 'kg', categoryId: categories[3].id, sku: 'SPC-GARAM-001', searchAliases: 'garam masala' },
    { name: 'Cumin Seeds (Jeera)', price: 300, unit: 'kg', categoryId: categories[3].id, sku: 'SPC-JEERA-001', searchAliases: 'jeera,cumin' },

    // Dairy & Eggs
    { name: 'Amul Milk (Full Cream)', price: 65, unit: 'litre', categoryId: categories[4].id, sku: 'DRY-MILK-001', searchAliases: 'milk,dudh' },
    { name: 'Curd (Amul)', price: 45, unit: 'packet', categoryId: categories[4].id, sku: 'DRY-CURD-001', searchAliases: 'curd,dahi,yogurt' },
    { name: 'Paneer', price: 80, unit: 'packet', categoryId: categories[4].id, sku: 'DRY-PANEER-001', searchAliases: 'paneer,cottage cheese' },
    { name: 'Eggs (Brown)', price: 8, unit: 'piece', categoryId: categories[4].id, sku: 'DRY-EGG-001', searchAliases: 'egg,ande' },

    // Snacks & Beverages
    { name: 'Parle-G Biscuits', price: 10, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-PG-001', searchAliases: 'parle g,biscuit' },
    { name: 'Maggi Noodles', price: 14, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-MAGGI-001', searchAliases: 'maggi,noodles' },
    { name: 'Lay\'s Chips (Classic)', price: 20, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-LAYS-001', searchAliases: 'lays,chips' },
    { name: 'Bournvita', price: 250, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-BVN-001', searchAliases: 'bournvita,chocolate drink' },
    { name: 'Brooke Bond Red Label Tea', price: 180, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-TEA-001', searchAliases: 'tea,chai,red label' },
    { name: 'Nescafe Classic Coffee', price: 220, unit: 'packet', categoryId: categories[5].id, sku: 'SNK-COFFEE-001', searchAliases: 'coffee,nescafe' },

    // Personal Care
    { name: 'Lifebuoy Soap', price: 35, unit: 'piece', categoryId: categories[6].id, sku: 'PRC-SOAP-001', searchAliases: 'soap,lifebuoy' },
    { name: 'Colgate Toothpaste', price: 95, unit: 'piece', categoryId: categories[6].id, sku: 'PRC-TOOTH-001', searchAliases: 'toothpaste,colgate,dant manjan' },
    { name: 'Head & Shoulders Shampoo', price: 210, unit: 'piece', categoryId: categories[6].id, sku: 'PRC-SHAM-001', searchAliases: 'shampoo,head shoulders' },
    { name: 'Handwash (Dettol)', price: 120, unit: 'piece', categoryId: categories[6].id, sku: 'PRC-HWASH-001', searchAliases: 'handwash,dettol,hand wash' },

    // Household
    { name: 'Surf Excel Detergent', price: 130, unit: 'packet', categoryId: categories[7].id, sku: 'HH-SURF-001', searchAliases: 'surf excel,detergent,sabun' },
    { name: 'Vim Dishwash Liquid', price: 99, unit: 'piece', categoryId: categories[7].id, sku: 'HH-VIM-001', searchAliases: 'vim,dishwash,dish soap' },
    { name: 'Harpic Toilet Cleaner', price: 85, unit: 'piece', categoryId: categories[7].id, sku: 'HH-HARPIC-001', searchAliases: 'harpic,toilet cleaner' },
    { name: 'Garbage Bags (Roll)', price: 50, unit: 'packet', categoryId: categories[7].id, sku: 'HH-GBAG-001', searchAliases: 'garbage bags,kachra bag' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `seed-${product.sku}` },
      update: {},
      create: {
        id: `seed-${product.sku}`,
        name: product.name,
        price: product.price,
        unit: product.unit,
        storeId: demoStore.id,
        categoryId: product.categoryId,
        sku: product.sku,
        searchAliases: product.searchAliases,
      },
    });
  }
  console.log(`  ✅ ${products.length} products created`);

  // Create sample customers
  const customers = [
    { name: 'Priya Agarwal', phone: '+919876543211', address: '45 Gandhi Nagar, Jaipur' },
    { name: 'Amit Kumar', phone: '+919876543212', address: '78 Civil Lines, Jaipur' },
    { name: 'Sunita Devi', phone: '+919876543213', address: '12 Johari Bazaar, Jaipur' },
    { name: 'Rahul Singh', phone: '+919876543214', address: '90 Malviya Nagar, Jaipur' },
    { name: 'Neha Gupta', phone: '+919876543215', address: '33 Vaishali Nagar, Jaipur' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { storeId_phone: { storeId: demoStore.id, phone: c.phone } },
      update: {},
      create: { ...c, storeId: demoStore.id },
    });
  }
  console.log(`  ✅ ${customers.length} customers created`);

  console.log('\n🎉 GrocGo seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Super Admin:  admin@grocgo.com / admin123');
  console.log('   Shopkeeper:   shopkeeper@example.com / admin123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
