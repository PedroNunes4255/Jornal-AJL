const latestContainer = document.getElementById("latestNews");
const homeContainer = document.getElementById("homeNews");
const heroContainer = document.getElementById("heroNews");

if (window.NEWS_DATA && window.NEWS_DATA.length > 0) {

  // MAIS NOVA PRIMEIRO
  const sortedNews = [...window.NEWS_DATA].reverse();

  // PRINCIPAL
  const principal = sortedNews[0];

  if (heroContainer && principal) {

    heroContainer.innerHTML = `
      <a class="media" href="./pages/${principal.slug}">
        <img src="./IMG/${principal.image}" alt="">
      </a>

      <div class="content">

        <div class="kicker">
          ${principal.category}
        </div>

        <h1 class="headline">
          <a href="./pages/${principal.slug}">
            ${principal.title}
          </a>
        </h1>

        <p class="subhead">
          ${principal.excerpt}
        </p>

        <div class="meta">
          <span>
            Por ${principal.author}
          </span>

          <span>•</span>

          <a class="btn btn-primary" href="./pages/${principal.slug}">
            Ler matéria
          </a>
        </div>

      </div>
    `;
  }

  // ÚLTIMAS
  const latestNews = sortedNews.slice(1, 9);

  if (latestContainer) {

    latestContainer.innerHTML = "";

    latestNews.forEach(news => {

      latestContainer.innerHTML += `
        <a class="side-item" href="./pages/${news.slug}">

          <img src="./IMG/${news.image}" alt="">

          <div>

            <div class="t">
              ${news.excerpt}
            </div>

            <div class="m">
              ${news.category} • Por ${news.author}
            </div>

          </div>

        </a>
      `;
    });
  }

  // MAIS NOTÍCIAS
  const moreNews = sortedNews.slice(1);

  if (homeContainer) {

    homeContainer.innerHTML = "";

    moreNews.forEach(news => {

      homeContainer.innerHTML += `
        <article class="card">

          <a class="media" href="./pages/${news.slug}">
            <img src="./IMG/${news.image}" alt="">
          </a>

          <div class="content">

            <div class="kicker">
              ${news.category}
            </div>

            <h3 class="title">
              <a href="./pages/${news.slug}">
                ${news.title}
              </a>
            </h3>

            <p class="excerpt">
              ${news.excerpt}
            </p>

            <div class="meta">
              <span>
                Por ${news.author}
              </span>
            </div>

          </div>

        </article>
      `;
    });
  }
}