// footer fade-in on scroll
const footer = document.querySelector('footer');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) footer.classList.add('visible'); });
}, { threshold: 0.15 });
observer.observe(footer);
