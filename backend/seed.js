import db from './db.js';

console.log('Seeding database...');

// Вспомогательная функция для выполнения SQL
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Вспомогательная функция для получения одной записи
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function seed() {
  try {
    // Вставляем категории
    const cats = ['Твердые шампуни', 'Гидролаты', 'Эфирные масла', 'Крема', 'Услуги'];
    for (const c of cats) {
      try {
        await run('INSERT OR IGNORE INTO categories (name, slug) VALUES (?,?)', 
          [c, c.toLowerCase().replace(/\s+/g, '-')]);
      } catch (e) {
        console.error('Error inserting category:', e);
      }
    }

    // Находим ID категории "Услуги"
    const services = await get('SELECT id FROM categories WHERE name = ?', ['Услуги']);
    const servicesCatId = services ? services.id : null;

    // Вставляем два сервисных продукта в категорию "Услуги"
    if (servicesCatId) {
      const massages = [
        {
          name: 'Массаж в технике АТТ',
          description: 'Расслабляющий и восстанавливающий массаж в технике АТТ.',
          price: 2500,
          stock: '10',
          image_url: 'https://images.pexels.com/photos/4056532/pexels-photo-4056532.jpeg'
        },
        {
          name: 'Индивидуальное женское парение',
          description: 'Традиционная банная процедура с травами, направленная на восстановление женской энергии.',
          price: 4000,
          stock: '5',
          image_url: 'https://images.pexels.com/photos/6620940/pexels-photo-6620940.jpeg'
        }
      ];
      
      for (const p of massages) {
        try {
          const result = await run(
            'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?,?,?,?,?,?)',
            [p.name, p.description, p.price, p.stock, servicesCatId, p.image_url]
          );
          console.log(`Inserted product: ${p.name}`);
        } catch (error) {
          console.error('Error inserting product:', error);
        }
      }
    }

    console.log('✅ Seed completed');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
}

// Запускаем сидинг
seed().then(() => {
  console.log('Seeding process finished');
  // Не закрываем соединение с БД, чтобы сервер мог продолжать работать
});