# Migrations

Add migration files named `YYYYMMDDHHMM-description.js` exporting a default async function receiving the mongoose instance.

Example:
```js
export default async function(mongoose) {
  await mongoose.connection.collection('dailyoperations').createIndex({ branch: 1, date: -1 });
}
```
Run with:
```bash
npm run migrate
```
