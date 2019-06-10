const getImages = () => {
  const images = document.getElementsByTagName('img');
  for(let i = 0; i < images.length; i++) {
    if (!images[i].alt && altTags && altTags[images[i].src]) {
      images[i].alt = altTags[images[i].src];
    } else if (!images[i].alt && altTags && !altTags[images[i].src]) {
      axios.get('/get-alt', {
        params: {
          src: encodeURIComponent(images[i].src)
        }
      })
        .then(function (response) {
          if (response.data.length > 1) {
            images[i].alt=response.data.join(', ');
          } else if (response.data.length == 1) {
            images[i].alt=response.data[0];
          } else {
            images[i].alt="";
          }
        })
        .catch(function () {
          images[i].alt="";
        });
    }
  }
}
document.addEventListener('DOMContentLoaded', getImages, false);
