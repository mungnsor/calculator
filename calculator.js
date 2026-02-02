function calc(op) {
  const a = Number(document.getElementById("a").value);
  const b = Number(document.getElementById("b").value);
  let r;

  if (op === "+") r = a + b;
  if (op === "-") r = a - b;
  if (op === "*") r = a * b;
  if (op === "/") r = b !== 0 ? a / b : "0-ээр хуваах боломжгүй";

  document.getElementById("result").innerText = "Хариу: " + r;
}
