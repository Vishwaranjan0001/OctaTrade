// Transactions (registration, wallets and trades) require a replica set.
// Run on every Compose start; preserve the existing set and its data.
try {
  rs.status();
} catch (error) {
  if (error.code !== 94 && error.codeName !== 'NotYetInitialized') throw error;
  const result = rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }],
  });
  if (result.ok !== 1) throw new Error(JSON.stringify(result));
}

for (let attempt = 0; attempt < 60; attempt++) {
  if (db.hello().isWritablePrimary) {
    print('MongoDB replica set rs0 is ready.');
    quit(0);
  }
  await sleep(1000);
}
throw new Error('MongoDB did not elect a primary within 60 seconds.');
