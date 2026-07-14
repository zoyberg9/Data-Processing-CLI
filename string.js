// Task 1 — Parse a log line
const inp = '2026-07-03T12:15:44Z INFO auth-service 200 84 POST /api/login';
const[
    timestamp, 
    level,
    service,
    status,
    responseTime,
    method,
    path] = inp.split(' ')
const result1 = {
    timestamp, 
    level,
    service,
    status: Number(status),
    responseTime: Number(responseTime),
    method,
    path
}
console.log(result1)

// Task 2 — Normalize a sentence
const normik = "   HeLLo    WoRLD    "
const result2 = normik
    .trim()
    .toLowerCase()
    .replace(/\s+/, " ");
console.log(result2)

// Task 3 — Extract file extension
const filename = 'archive.backup.tar.gz'
const result3 = filename.split('.')[3]
console.log(result3)

//Task 4 — Convert snake_case to camelCase
const snake = 'user_first_name'
const result4 = snake
    .split('_')
    .map((word, index) => 
        index === 0
        ? word
        : word[0].toUpperCase() + word.slice(1)
    )
    .join('');
console.log(result4)


const input = "1234567812345678";
const result5 =
  "*".repeat(input.length - 4) +
  input.slice(-4);
console.log(result5)

//Task 6
const t6 = 'https://example.com/users/42?sort=asc&page=2'

