const { SHA256 } = require('crypto-js');
const jwt = require('jsonwebtoken');

const data = {
  id: 4
};

const token = jwt.sign(data, 'SoSalty!');
console.log(token);
const decoded = jwt.verify(token, 'SoSalty!');
console.log('decoded', decoded);

// const message = 'I am user number 3';
// const hash = SHA256(message).toString();

// console.log(`message: ${message}`);
// console.log(`hash: ${hash}`);


// const token = {
//   data,
//   hash: SHA256(`${JSON.stringify(data)}someSecretSalt`).toString()
// };

// const resultHash = SHA256(`${JSON.stringify(token.data)}someSecretSalt`).toString();

// if (resultHash === token.hash) {
//   console.log('Data was not changed. Proceed ahead.');
// } else {
//   console.log('Data was changed. Do not trust.');
// }