function copyContent(...items) {
	window.getSelection().removeAllRanges();

	let containerElement = document.createElement("div");
	containerElement.style.setProperty("position", "fixed");
	containerElement.style.setProperty("top", 0);
	containerElement.style.setProperty("left", 0);
	containerElement.style.setProperty("z-index", -1);
	containerElement.style.setProperty("opacity", 0);
	containerElement.style.setProperty("pointer-events", "none");
	containerElement.style.setProperty("font-family", "Menlo, monospace");
	containerElement.style.setProperty("font-size", "11px");
	containerElement.append(...items);

	document.body.appendChild(containerElement);

	let range = document.createRange();
	range.selectNode(containerElement);
	window.getSelection().addRange(range);

	document.execCommand("copy");

	window.getSelection().removeAllRanges();

	containerElement.remove();
}

function createButton(textContent, handleClick) {
	let buttonElement = document.createElement("button");
	buttonElement.type = "button";
	buttonElement.textContent = textContent;
	buttonElement.addEventListener("click", handleClick);
	return buttonElement;
}

function createLink(href, textContent) {
	let linkElement = document.createElement("a");
	linkElement.href = href;
	linkElement.textContent = textContent || href;
	return linkElement;
}

let radar = Array.from(document.getElementsByClassName("bz_comment_text")).reverse().reduce((accumulator, currentValue) => {
	if (accumulator)
		return accumulator;

	if (/^<rdar:\/\/problem\/\d+>$/.test(currentValue.textContent))
		return currentValue.textContent;

	return null;
}, null);

let bugDetailsElement = document.getElementById("bug_details");
if (bugDetailsElement) {
	let buttonContainer = bugDetailsElement.insertAdjacentElement("beforebegin", document.createElement("div"));
	buttonContainer.style.setProperty("position", "-webkit-sticky");
	buttonContainer.style.setProperty("top", 0);
	buttonContainer.style.setProperty("padding", "4px 0");
	buttonContainer.style.setProperty("background-color", "hsla(0, 0%, 100%, 0.9)");

	buttonContainer.appendChild(createButton("ID", event => {
		let match = window.location.search.match(/(?:(?:\?|&)id\=)(\d+)(?:&|$)/);
		if (!match || !match[1].length)
			return;

		copyContent(match[1]);
	}));

	buttonContainer.appendChild(createButton("URL", event => {
		let match = window.location.search.match(/(?:(?:\?|&)id\=)(\d+)(?:&|$)/);
		if (!match || !match[1].length)
			return;

		copyContent(createLink(`https://webkit.org/b/${match[1]}`));
	}));

	buttonContainer.appendChild(createButton("Combined", event => {
		let match = window.location.search.match(/(?:(?:\?|&)id\=)(\d+)(?:&|$)/);
		let descriptionElement = document.getElementById("short_desc_nonedit_display");
		if (!match || !match[1].length || !descriptionElement)
			return;

		copyContent("<", createLink(`https://webkit.org/b/${match[1]}`), "> ", descriptionElement.textContent);
	}));

	buttonContainer.appendChild(createButton("Markdown", event => {
		let match = window.location.search.match(/(?:(?:\?|&)id\=)(\d+)(?:&|$)/);
		let descriptionElement = document.getElementById("short_desc_nonedit_display");
		if (!match || !match[1].length || !descriptionElement)
			return;

		copyContent(`[${match[1]}](`, createLink(`https://webkit.org/b/${match[1]}`), `) ${descriptionElement.textContent}`);
	}));

	buttonContainer.appendChild(createButton("ChangeLog", event => {
		let descriptionElement = document.getElementById("short_desc_nonedit_display");
		if (!descriptionElement)
			return;

		let items = [descriptionElement.textContent, document.createElement("br"), createLink(window.location.href)];
		if (radar && radar.length)
			items.push(document.createElement("br"), radar);
		copyContent(...items);
	}));

	if (radar && radar.length) {
		buttonContainer.appendChild(createButton("Radar", event => {
			copyContent(radar);
		}));
	}
}

let bugsHeader = document.querySelector(".bz_buglist_header");
if (bugsHeader) {
	if (bugsHeader.children.length)
		bugsHeader.children[0].classList.remove("first-child");

	bugsHeader.insertAdjacentElement("afterbegin", document.createElement("td")).colspan = 1;
}

let lastCheckedCheckboxIndex = NaN;
let checkboxElements = Array.from(document.querySelectorAll(".bz_bugitem")).map((bugRowElement, index) => {
	if (bugRowElement.children.length)
		bugRowElement.children[0].classList.remove("first-child");

	let checkboxContainer = bugRowElement.insertAdjacentElement("afterbegin", document.createElement("td"));

	let checkboxElement = checkboxContainer.appendChild(document.createElement("input"));
	checkboxElement.type = "checkbox";
	checkboxElement.addEventListener("click", event => {
		if (event.shiftKey && !isNaN(lastCheckedCheckboxIndex)) {
			for (let i = Math.min(lastCheckedCheckboxIndex, index); i <= Math.max(lastCheckedCheckboxIndex, index); ++i)
				checkboxElements[i].checked = checkboxElement.checked;
		}

		lastCheckedCheckboxIndex = index;
	});
	return checkboxElement;
});

let resultCount = document.querySelector(".bz_result_count");
if (resultCount) {
	let buttonContainer = resultCount.insertAdjacentElement("afterend", document.createElement("div"));
	buttonContainer.style.setProperty("position", "-webkit-sticky");
	buttonContainer.style.setProperty("top", 0);
	buttonContainer.style.setProperty("padding", "4px 0");
	buttonContainer.style.setProperty("background-color", "hsla(0, 0%, 100%, 0.9)");

	function copyMultiple(getContent) {
		let fragment = document.createDocumentFragment();
		for (let checkboxElement of checkboxElements) {
			if (!checkboxElement.checked)
				continue;

			let items = getContent(checkboxElement);
			if (!items || !items.length)
				continue;

			if (fragment.childNodes.length) {
				fragment.appendChild(document.createElement("br"));

				if (items.some(item => item instanceof HTMLBRElement))
					fragment.appendChild(document.createElement("br"));
			}

			fragment.append(...items);
		}

		if (!fragment.childNodes.length)
			return;

		copyContent(fragment);
	}

	buttonContainer.appendChild(createButton("ID", event => {
		copyMultiple(checkbox => {
			let idElement = checkbox.parentElement.parentElement.querySelector(".bz_id_column");
			if (!idElement)
				return null;

			return [idElement.textContent.trim()];
		});
	}));

	buttonContainer.appendChild(createButton("URL", event => {
		copyMultiple(checkbox => {
			let idElement = checkbox.parentElement.parentElement.querySelector(".bz_id_column");
			if (!idElement)
				return null;

			return [createLink(`https://webkit.org/b/${idElement.textContent.trim()}`)];
		});
	}));

	buttonContainer.appendChild(createButton("Combined", event => {
		copyMultiple(checkbox => {
			let idElement = checkbox.parentElement.parentElement.querySelector(".bz_id_column");
			let descriptionElement = checkbox.parentElement.parentElement.querySelector(".bz_short_desc_column");
			if (!idElement || !descriptionElement)
				return null;

			return ["<", createLink(`https://webkit.org/b/${idElement.textContent.trim()}`), "> ", descriptionElement.textContent.trim()];
		});
	}));

	buttonContainer.appendChild(createButton("Markdown", event => {
		copyMultiple(checkbox => {
			let idElement = checkbox.parentElement.parentElement.querySelector(".bz_id_column");
			let descriptionElement = checkbox.parentElement.parentElement.querySelector(".bz_short_desc_column");
			if (!idElement || !descriptionElement)
				return null;

			return [`[${idElement.textContent.trim()}](`, createLink(`https://webkit.org/b/${idElement.textContent.trim()}`), `) ${descriptionElement.textContent.trim()}`];
		});
	}));

	buttonContainer.appendChild(createButton("ChangeLog", event => {
		copyMultiple(checkbox => {
			let idLinkElement = checkbox.parentElement.parentElement.querySelector(".bz_id_column > a");
			let descriptionElement = checkbox.parentElement.parentElement.querySelector(".bz_short_desc_column");
			if (!idLinkElement || !descriptionElement)
				return null;

			return [descriptionElement.textContent.trim(), document.createElement("br"), createLink(idLinkElement.href)];
		});
	}));
}
