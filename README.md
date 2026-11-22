# AW Studio | Aaradhya Web

AW Studio’s website introduces its web design and development, performance marketing, and SEO and content services. Visitors can explore the studio’s approach and create a project brief by choosing a service and describing their goal. The brief is generated in the browser and can be copied for sharing.

## Run locally

From the repository root, start a local server with Python 3:

```sh
python3 -m http.server 8000
```

Open [the local preview](http://localhost:8000). The site uses static HTML, CSS, and JavaScript modules and needs no build step.

## Edit the site

| File | Purpose |
| --- | --- |
| `index.html` | Page copy, service descriptions, and project brief form |
| `assets/site.css` | Layout, typography, and responsive styles |
| `assets/site.js` | Project brief interactions and animation setup |
| `assets/network.js` and `assets/land.js` | Network visualization and its geographic data |
| `assets/inter.woff2` and `assets/Inter-OFL.txt` | Bundled Inter font and its license |

## Host the site

Upload `index.html` and the entire `assets/` folder to the same directory on a static web host. Keep the folder structure intact so the browser can load the styles, scripts, and font.
