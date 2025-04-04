
document.addEventListener("DOMContentLoaded", function () {
  const perguntas = document.querySelectorAll(".faq-question");

  perguntas.forEach(pergunta => {
    pergunta.addEventListener("click", () => {
      const item = pergunta.closest(".faq-item");

      // Alternar classe active no faq-item
      item.classList.toggle("active");
    });
  });
});
