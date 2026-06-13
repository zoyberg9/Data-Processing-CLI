const users = ['Alice', 'Bob', 'Charlie'];

// Format each name into a URL string
const profileUrls = users.map(name => `https://api.com/${name.toLowerCase()}`);

console.log(profileUrls);
// Output: 
// [
//   'https://api.com',
//   'https://api.com',
//   'https://api.com'
// ]
