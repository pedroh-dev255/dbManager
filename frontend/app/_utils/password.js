export function generatePassword(length = 12) {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = upper + lower + numbers;

    const password = [
        upper[randomIndex(upper.length)],
        lower[randomIndex(lower.length)],
        numbers[randomIndex(numbers.length)],
    ];

    while (password.length < length) {
        password.push(all[randomIndex(all.length)]);
    }

    for (let index = password.length - 1; index > 0; index--) {
        const swapIndex = randomIndex(index + 1);
        [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
    }

    return password.join("");
}

function randomIndex(max) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}
