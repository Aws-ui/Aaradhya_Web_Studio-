# Aaradhya Web Studio

A responsive studio website featuring an interactive 3D network globe, particle background, dark and light themes, and sections for services, portfolio, pricing, FAQs, and contact.

## Run locally

Open `index.html` in a browser or serve this directory with `python3 -m http.server 8000` and visit `http://localhost:8000`. The site uses plain HTML, CSS, and JavaScript. It can be hosted on GitHub Pages or any static web host.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Studio content, navigation, and contact |
| `style.css` | Responsive layout, themes, and motion styles |
| `script.js` | Canvas animation, interface controls, and contact form |
| `logo.png` | Studio logo and favicon |

## Contact and motion

Update the `whatsappLink` URL in `index.html` to change the contact number for both the direct link and the inquiry form. The form opens a prefilled WhatsApp message for the visitor to send.

The hero renders a still globe when the visitor enables reduced motion. Animation also pauses when the hero leaves the viewport or the tab is hidden.
