const btn = document.getElementsByTagName("button")[0];
if (!(btn instanceof HTMLButtonElement)) throw new Error("No button found");

btn.addEventListener("click", () => changeBackground());

function changeBackground() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    document.body.style.background = `rgb(${red}, ${green}, ${blue})`;
}
