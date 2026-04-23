function checkAccountStatus() {
    // Some code above...

    // Update these lines with the new color
    display.innerHTML = display.innerHTML.replace(/color: var\(\--orange-yellow-crayola\);/g, 'color: var(--white-1);');
    display.innerHTML = display.innerHTML.replace(/color: #fbbf24;/g, 'color: var(--white-1);');

    // Some code below...
}