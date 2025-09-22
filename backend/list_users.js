const db = require('./db');

db.all('SELECT id, username, email, role FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error fetching users:', err.message);
    process.exit(1);
  }
  if (rows.length === 0) {
    console.log('No users found.');
  } else {
    console.log('Registered Users:');
    rows.forEach(user => {
      console.log(`ID: ${user.id} | Username: ${user.username} | Email: ${user.email} | Role: ${user.role}`);
    });
  }
  db.close();
});