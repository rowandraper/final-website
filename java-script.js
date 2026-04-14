// Pan and zoom for the map SVG
document.addEventListener('DOMContentLoaded', () => {
	const viewport = document.querySelector('.map-viewport');
	const inner = document.querySelector('.map-inner');
	const img = inner ? inner.querySelector('.map') : null;
	// support inline SVG (user inlined the svg into the HTML)
	const svg = inner ? inner.querySelector('svg') : null;
	// prefer the SVG if present, otherwise fall back to the image
	const target = svg || img;
	if (!viewport || !inner || !target) return;
	// prevent native image drag (for <img>) and selection on container
	if (img) {
		try { img.draggable = false; } catch (err) {}
		img.addEventListener('dragstart', (e) => e.preventDefault());
	}
	inner.style.userSelect = 'none';

    const panStep = 60;

document.querySelector('.map-controls .up')?.addEventListener('click', () => {
  translate.y += panStep;
  setTransform();
});

document.querySelector('.map-controls .down')?.addEventListener('click', () => {
  translate.y -= panStep;
  setTransform();
});

document.querySelector('.map-controls .left')?.addEventListener('click', () => {
  translate.x += panStep;
  setTransform();
});

document.querySelector('.map-controls .right')?.addEventListener('click', () => {
  translate.x -= panStep;
  setTransform();
});

	const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.06;
const ZOOM_INTENSITY = 0.002;

let scale = 0.8;
let translate = { x: 0, y: 0 };
let isPanning = false;
let start = { x: 0, y: 0 };

function setInitialView() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw <= 700) {
        scale = 1;
        translate.x = 0;
        translate.y = 0;
    } else if (vw <= 1100) {
        scale = 0.9;
        translate.x = 20;
        translate.y = -100;
        } else if (vw <= 1300) {
        scale = 0.9;
        translate.x = 20;
        translate.y = -150;
    } else {
        scale = 0.8;
        translate.x = 90;
        translate.y = -300;
    }
}
setInitialView();
setTransform();

	function setTransform() {
		// translate then scale keeps coordinates intuitive
		inner.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
	}

	// Pointer drag for panning (listen on both viewport and the target element — svg or img)
	function handlePointerDown(e) {
  // 🚫 don't start panning if clicking a pin
	if (e.target.closest('.pin, .pin-pv')) return;

  e.preventDefault();
  isPanning = true;
		start.x = e.clientX;
		start.y = e.clientY;
		// capture on the element that received the event
		try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
	}
	viewport.addEventListener('pointerdown', handlePointerDown);
	target.addEventListener('pointerdown', handlePointerDown);

	viewport.addEventListener('pointermove', (e) => {
		if (!isPanning) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		start.x = e.clientX;
		start.y = e.clientY;
		// move translates in screen pixels
		translate.x += dx;
		translate.y += dy;
		setTransform();
	});

	function endPan(e) {
		isPanning = false;
		try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
	}

	viewport.addEventListener('pointerup', endPan);
	viewport.addEventListener('pointercancel', endPan);
	// also listen on the svg/img target so releasing pointer over the svg works
	target.addEventListener('pointerup', endPan);
	target.addEventListener('pointercancel', endPan);

	// Wheel for zooming (use Ctrl+wheel or pinch gestures on some trackpads)
	viewport.addEventListener('wheel', (e) => {
		// if user holds ctrl (or it's a touchpad pinch that reports ctrlKey), zoom instead of scrolling
		e.preventDefault();
		const rect = inner.getBoundingClientRect();
		const cx = e.clientX - rect.left; // pointer x inside element
		const cy = e.clientY - rect.top;

		if (e.ctrlKey) {
			// use deltaY magnitude to compute a smooth exponential zoom factor
			const delta = -e.deltaY; // positive => zoom in
			const factor = Math.exp(delta * ZOOM_INTENSITY);
			const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
			const scaleRatio = newScale / scale;
			translate.x = (translate.x - cx) * scaleRatio + cx;
			translate.y = (translate.y - cy) * scaleRatio + cy;
			scale = newScale;
			setTransform();
		} else {
			// wheel without ctrl pans (slower on trackpads because delta smaller)
			translate.x -= e.deltaX;
			translate.y -= e.deltaY;
			setTransform();
		}
	}, { passive: false });

	// Optional: buttons with ids `zoom-in` and `zoom-out` if present
	const btnIn = document.getElementById('zoom-in');
	const btnOut = document.getElementById('zoom-out');
	if (btnIn) btnIn.addEventListener('click', () => {
		const rect = inner.getBoundingClientRect();
		const cx = rect.width / 2; const cy = rect.height / 2;
		const newScale = Math.min(MAX_SCALE, scale * ZOOM_STEP);
		const ratio = newScale / scale;
		translate.x = (translate.x - cx) * ratio + cx;
		translate.y = (translate.y - cy) * ratio + cy;
		scale = newScale; setTransform();
	});
	if (btnOut) btnOut.addEventListener('click', () => {
		const rect = inner.getBoundingClientRect();
		const cx = rect.width / 2; const cy = rect.height / 2;
		const newScale = Math.max(MIN_SCALE, scale / ZOOM_STEP);
		const ratio = newScale / scale;
		translate.x = (translate.x - cx) * ratio + cx;
		translate.y = (translate.y - cy) * ratio + cy;
		scale = newScale; setTransform();
	});

	// double-click to reset view
	viewport.addEventListener('dblclick', () => {
		scale = 1; translate.x = 0; translate.y = 0; setTransform();
	});

	// initialize
	inner.style.willChange = 'transform';
	setTransform();
});

document.addEventListener("DOMContentLoaded", function() {

// modal
var modal = document.getElementById("myModal");
var modalContent = modal ? modal.querySelector('.modal-content') : null;
var modalText = document.getElementById("modal-text");

// attach to the group that actually holds the data attribute
var pinGroups = document.querySelectorAll(".pin-group");
var pinPvs = document.querySelectorAll('.pin-pv');

function handlePinClick(element, evt) {
	// prevent the pan code from running when handling this click
	const group = element.closest('.pin-group');
    if (!group) return;

    const key = group.getAttribute('data-content');
    const id = "data-" + key;
    const content = document.getElementById(id);

	const isMapPage = document.body.classList.contains('map-page');
const isMobile = window.innerWidth <= 700;

if (isMapPage && isMobile) {
		// mobile: use the existing single modal (flows under map thanks to CSS)
		if (!modal || !modalContent || !modalText) return;
		modal.style.display = "block";
		modalText.innerHTML = content ? content.innerHTML : '<p>No data available for this location.</p>';

		// clear any previously opened extra panel in the modal
		const extraBoxModal = document.getElementById('modal-extra');
		if (extraBoxModal) {
			const prevKey = extraBoxModal.dataset.openedFor;
			if (prevKey) {
				document.querySelectorAll(`.open-extra[data-extra="${prevKey}"]`).forEach(el => el.style.display = '');
				delete extraBoxModal.dataset.openedFor;
			}
			extraBoxModal.classList.remove('active');
			extraBoxModal.innerHTML = '';
		}

		// attach extra panel logic AFTER content is injected
		const extraLinks = modalText.querySelectorAll('.open-extra');
		console.log("links found:", extraLinks.length); // debug

		extraLinks.forEach(link => {
			link.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();

				console.log("extra clicked");

				const key = this.dataset.extra;
				const extraContent = document.getElementById("extra-" + key);
				const extraBox = document.getElementById("modal-extra");

				if (extraContent && extraBox) {
					extraBox.innerHTML = extraContent.innerHTML;
					extraBox.classList.add("active");
					// record which key opened this extra so we can restore the link later
					extraBox.dataset.openedFor = key;
					// hide the original 'More info' link that was clicked
					this.style.display = 'none';

					// attach close handlers for any close-extra links inside the injected extraBox (mobile)
					const closeLinksInExtraBox = extraBox.querySelectorAll('.close-extra');
					closeLinksInExtraBox.forEach(cl => {
						cl.addEventListener('click', function(ev) {
							ev.preventDefault(); ev.stopPropagation();
							const k = extraBox.dataset.openedFor;
							if (k) document.querySelectorAll(`.open-extra[data-extra="${k}"]`).forEach(el=> el.style.display='');
							delete extraBox.dataset.openedFor;
							extraBox.classList.remove('active');
							extraBox.innerHTML = '';
						});
					});
				}
			});
		});
		// attach close handlers for any close-extra links inside the injected modal content
		const closeExtraLinks = modalText.querySelectorAll('.close-extra');
		closeExtraLinks.forEach(link => {
			link.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				const extraBox = document.getElementById('modal-extra');
				if (extraBox) {
					// restore open-extra link if we recorded a key
					const k = extraBox.dataset.openedFor;
					if (k) {
						document.querySelectorAll(`.open-extra[data-extra="${k}"]`).forEach(el=> el.style.display='');
						delete extraBox.dataset.openedFor;
					}
					extraBox.classList.remove('active');
					extraBox.innerHTML = '';
				}
			});
		});

		// position modal-content near the clicked pin (clamped to viewport)
		const rect = element.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;

		// preferred offset
		const prefLeft = x - 100;
		const prefTop = y - 200;

		const mw = modalContent.offsetWidth;
		const mh = modalContent.offsetHeight;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// clamp so the popup stays fully visible
		const left = Math.min(Math.max(8, prefLeft), Math.max(8, vw - mw - 8));
		const top = Math.min(Math.max(8, prefTop), Math.max(8, vh - mh - 8));

		modalContent.style.left = left + "px";
		modalContent.style.top = top + "px";
		return;
	}

	// desktop: create a dedicated floating popup so multiple can be open
	const popup = document.createElement('div');
	popup.className = 'pin-popup';
	popup.innerHTML = `
	  <span class="popup-close" aria-label="Close">&times;</span>
	  <div class="popup-body">${content ? content.innerHTML : '<p>No data available for this location.</p>'}</div>
	  <div class="popup-extra"></div>
	`;
	document.body.appendChild(popup);

	console.log("popup HTML:", popup.innerHTML);
	// STEP 2: find links INSIDE popup
	const links = popup.querySelectorAll('.open-extra');

	// STEP 3: attach click
	links.forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			console.log("extra clicked");

			// STEP 4: get content
			const key = this.dataset.extra;
			const extraContent = document.getElementById("extra-" + key);

			// STEP 5: inject into popup
			const extraBox = popup.querySelector('.popup-extra');

			if (extraContent && extraBox) {
				extraBox.innerHTML = extraContent.innerHTML;
				// show as a side panel to the right of the data box
				extraBox.classList.add('active');
				// record opened key and hide the clicked link inside popup
				extraBox.dataset.openedFor = key;
				try { this.style.display = 'none'; } catch (err) {}
				// attach close handlers for any close-extra links inside the injected extraBox
				const closeLinks = extraBox.querySelectorAll('.close-extra');
				closeLinks.forEach(cl => {
					cl.addEventListener('click', function(ev) {
						ev.preventDefault(); ev.stopPropagation();
						// restore open-extra link(s)
						const k = extraBox.dataset.openedFor;
						if (k) document.querySelectorAll(`.open-extra[data-extra="${k}"]`).forEach(el=> el.style.display='');
						delete extraBox.dataset.openedFor;
						extraBox.classList.remove('active');
						extraBox.innerHTML = '';
					});
				});
			}

		});
	});

	// attach close handlers for any close-extra links inside the popup
	const closeLinksInPopup = popup.querySelectorAll('.close-extra');
	closeLinksInPopup.forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			const extraBox = popup.querySelector('.popup-extra');
			if (extraBox) {
				const k = extraBox.dataset.openedFor;
				if (k) document.querySelectorAll(`.open-extra[data-extra="${k}"]`).forEach(el=> el.style.display='');
				delete extraBox.dataset.openedFor;
				extraBox.classList.remove('active');
				extraBox.innerHTML = '';
			}
		});
	});

	// position the popup around the pin (clamped inside viewport)
	const rect2 = element.getBoundingClientRect();
	const x2 = rect2.left + rect2.width / 2;
	const y2 = rect2.top + rect2.height / 2;
	const prefLeft2 = x2 + 12; // place to the right of pin by default
	const prefTop2 = y2 - 24; // slightly above center

	const mw2 = popup.offsetWidth || 300;
	const mh2 = popup.offsetHeight || 200;
	const vw2 = window.innerWidth;
	const vh2 = window.innerHeight;

	const left2 = Math.min(Math.max(8, prefLeft2), Math.max(8, vw2 - mw2 - 8));
	const top2 = Math.min(Math.max(8, prefTop2), Math.max(8, vh2 - mh2 - 8));

	popup.style.left = left2 + 'px';
	popup.style.top = top2 + 'px';

	// close button for this popup
	const closeBtn = popup.querySelector('.popup-close');
	closeBtn.addEventListener('click', () => popup.remove());

	// enable dragging of the popup (and also stop propagation so map won't pan)
	popup.style.touchAction = 'none';
	popup.addEventListener('pointerdown', function startDrag(e) {
		// don't start drag when clicking the close button or interactive content
		if (e.target.closest('.popup-close')) return;
		if (e.target.closest('a, button, input, textarea, select, label, .open-extra')) return;
		if (e.button && e.button !== 0) return; // only left button

		// allow clicks on links/buttons to function normally
		e.stopPropagation();

		const rectP = popup.getBoundingClientRect();
		const offsetX = e.clientX - rectP.left;
		const offsetY = e.clientY - rectP.top;

		popup.classList.add('dragging');
		try { popup.setPointerCapture && popup.setPointerCapture(e.pointerId); } catch (err) {}

		function onMove(ev) {
			const nx = ev.clientX - offsetX;
			const ny = ev.clientY - offsetY;
			// clamp inside viewport with 8px margin
			const vw = window.innerWidth; const vh = window.innerHeight;
			const mw = popup.offsetWidth; const mh = popup.offsetHeight;
			const left = Math.min(Math.max(8, nx), Math.max(8, vw - mw - 8));
			const top = Math.min(Math.max(8, ny), Math.max(8, vh - mh - 8));
			popup.style.left = left + 'px';
			popup.style.top = top + 'px';
		}

		function onUp(ev) {
			popup.classList.remove('dragging');
			try { popup.releasePointerCapture && popup.releasePointerCapture(ev.pointerId); } catch (err) {}
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
		}

		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
	});
}

document.querySelectorAll(".pin-group").forEach(g => {
  g.addEventListener("click", function(evt) {
    handlePinClick(this, evt);
  });
});

// pins.forEach(pin => {
//   pin.addEventListener("click", function() {
//     console.log("clicked");
//     modal.style.display = "block";

//     const id = "data-" + pin.dataset.content;
//     modalText.innerHTML = document.getElementById(id).innerHTML;
//   });
// });

// close button
var span = document.querySelector(".close");

span.onclick = function() {
  modal.style.display = "none";
}


});

 document.addEventListener('DOMContentLoaded', () => {
  const layers = [
    { el: document.querySelector('.tree'),     speed: -0.75 },
    { el: document.querySelector('.Galton'),   speed: -1.4 },
    { el: document.querySelector('.Macmurchy'), speed: -0.89 },
    { el: document.querySelector('.Davenport'), speed: -1.4 },
    { el: document.querySelector('.Building'), speed: -0.72 },
        { el: document.querySelector('.Protest'), speed: -1.55 },
        { el: document.querySelector('.Boyer'), speed: -1.2 },
         { el: document.querySelector('.Lombard'), speed: -0.7 },
  ];

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    layers.forEach(layer => {
      if (layer.el) {
        layer.el.style.transform =
          `translateX(-50%) translateY(${y * layer.speed}px) scale(1)`;
          
      }
    });
  });
});