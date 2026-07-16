function revealOnScroll() {
  const elements = document.querySelectorAll('.fade-in');
  const trigger = window.innerHeight * 0.9;

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < trigger) {
      el.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

const connectBtn = document.getElementById('connectBtn');
connectBtn.addEventListener('click', () => {
  window.open(
    'https://www.linkedin.com/in/howard-rincon-3205a52aa/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BukNT2dD0Rj2Oy00lVup0KQ%3D%3D',
    '_blank',
    'noopener,noreferrer'
  );
});
