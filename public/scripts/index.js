var modal = document.getElementById('modal');
var modalImage = document.getElementById('modal-img');
var modalTitle = document.getElementById('modal-title');
var modalDescription = document.getElementById('modal-description');
var close = document.getElementById('close');
var slider = document.getElementById('slider');
var mainContainer = document.getElementById('main-container');
var button = document.getElementById('works-btn');
var contactsIcon = document.getElementById('contacts');
var contacts = document.getElementById('contacts-hidden');
var contactsCloseBtn = document.getElementById('footer-close');
var phoneIcon = document.getElementById('phone');
var footer = document.getElementsByTagName('footer')[0];
var filterBtn = document.getElementById('dropdown-btn');
var filterContent = document.getElementsByClassName('dropdown-content')[0];

var slideIndex = 1;
var target; // for intersection observer
var noMoreFetchData = false; // for canceling requests when there is no more data: HTTP/204

// for getting su presence
var isSU = document.getElementById('ejs').textContent === "su" ? true : false;

// delete all non-romanian (romanian is the default language) content at first
document.querySelectorAll('[lang=ru]').forEach(element => {
    if (element.nodeName === 'HTML') return;

    element.classList.add('hidden-content');
});

addCloseModalEvent();

// =====
// Modal
// =====

function addModalEvents() {
    let thumbnails = document.getElementsByClassName('thumbnail');

    for(t of thumbnails) {
        let images = [],
            title = null,
            description = null,
            id = t.dataset.workId;

        for(child of t.children)
            if(child.className === 'thumbnail-imgs')
                for(image of child.children)
                    images.push(image.getAttribute('data-src'));
            else if (child.className === 'thumbnail-title')
                title = child.innerText;
            else if (child.className === 'hidden-description')
                description = child.innerText;

        t.onclick = () => {
            if (!isSU)
                axios.put(`/api/works/${id}/views`)
                .catch(err => console.log(err));

            if(images) createModalSlides(images);
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modalDescription.classList.add('modal-description-top-margin');
            document.body.classList.add('body-no-scroll');

            if (images) createModalSlides(images);
            if(title) modalTitle.innerText = title;
            if(description) modalDescription.innerText = description;
            if(images.length > 1) createSlideControlButtons();
            showSlides(1);
        };
    }
}

function handleModalClose() {
    modal.style.display = 'none';
    //modalImage.src = '';
    clearModalSlides();
    slideIndex = 1;
    modalTitle.innerText = '';
    modalDescription.innerText = '';
    document.body.classList.remove('body-no-scroll');
    modalDescription.classList.remove('modal-description-top-margin');
}

function addCloseModalEvent() {
    close.addEventListener('click', e => {
        handleModalClose();
    });

    window.onclick = e => {
        if(e.target == modal && modal.style.display === 'block')
            handleModalClose();
    }
}

function createSlideControlButtons() {
    let prev = document.createElement('A');
    prev.id = 'prev';
    prev.onclick = () => plusSlides(-1);
    prev.innerText = '\u203A';
    prev.style.transform = 'rotate(180deg)';

    let next = document.createElement('A');
    next.id = 'next';
    next.onclick = () => plusSlides(1);
    next.innerText = '\u203A';

    slider.appendChild(prev);
    slider.appendChild(next);
}

function createModalSlides(images) {
    for(let i = 0; i < images.length; i++) {
        let imgDiv = document.createElement('DIV');
        imgDiv.classList.add('slide');
        imgDiv.classList.add('fade');
        imgDiv.id = `slide${i + 1}`;

        let img = document.createElement('IMG');
        // img.classList.add('slider-img');
        img.src = images[i];

        imgDiv.appendChild(img);
        slider.appendChild(imgDiv);
    }
}

function clearModalSlides() {
    while (slider.firstChild)
        slider.removeChild(slider.lastChild);
}

// =============
// Search button
// =============

button.addEventListener('click', (e) => {
    // set the cookie to send the current time to the API
    document.cookie = `works_last_date=${new Date(Date.now()).toISOString()}`;
    destroyThumbnails();
    noMoreFetchData = false;

    axios.get(`/api/works?lang=${language}`)
        .then(res => {
            if (res.status == 204) noMoreFetchData = true;

            displayWorksAfterFetching(res.data);
             console.log(res.data);
            for(let target of document.getElementsByClassName('thumbnail'))
                observeOnScroll(target);

            //mainContainer.style.display = 'block';
            mainContainer.classList.remove('hidden-content');
            mainContainer.scrollIntoView({ behavior: 'smooth' });
            mainContainer.classList.add('fade-appear');
            addModalEvents();
        })
        .catch(err => console.log(err));
});

// ========
// Contacts
// ========

// once an animation for the contacts button
contactsIcon.addEventListener('click', e => {
    // if(footer.style.display === 'none')
    //     footer.style.display = 'flex';
    footer.classList.remove('hidden-content');
    footer.scrollIntoView({behavior: 'smooth'});

    //contactsIcon.remove();
    contactsIcon.classList.add('hidden-content');
});

contactsCloseBtn.onclick = () => {
    footer.classList.add('hidden-content')
    contactsIcon.classList.remove('hidden-content');
};

// ======
// Slider
// ======

// next and prev controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    let slides = document.getElementsByClassName('slide');

    if(n > slides.length) slideIndex = 1;
    else if (n < 1) slideIndex = slides.length;

    for(slide of slides) slide.style.display = 'none';

    slides[slideIndex-1].style.display = 'block';
}

// ==========
// Thumbnails
// ==========

// creating thumbnails
function createThumbnail(images, title, description, id) {
    let thumbnails = document.getElementById('thumbnails');
    
    let thumbnail = document.createElement('DIV');
    let imagesDiv = document.createElement('DIV');
    //let titleDiv = document.createElement('DIV');

    // thumbnail-imgs
    for(let image of images) {
        if(image == null || image == undefined) continue;

        let img = document.createElement('IMG');

        img.classList.add('thumbnail-img');
        //img.src = image;
        img.setAttribute('data-src', image);
        imagesDiv.appendChild(img);
    }

    // thumbnail-title
    let titleH3 = document.createElement('h3');

    titleH3.classList.add('thumbnail-title');
    titleH3.innerText = title;
    //titleDiv.appendChild(titleH3);
    
    thumbnail.classList.add('thumbnail');
    thumbnail.classList.add('lazy-thumbnail');
    imagesDiv.classList.add('thumbnail-imgs');

    // appending to the parent divs
    thumbnail.appendChild(imagesDiv);
    thumbnail.appendChild(titleH3);
    
    // description
    if(description && description !== '') {
        let descriptionP = document.createElement('P');
        
        descriptionP.classList.add('hidden-description');
        descriptionP.innerText = description;
        thumbnail.appendChild(descriptionP);
    }
    
    // make thumbnail "tabbable"
    thumbnail.tabIndex = 0;
    thumbnail.dataset.workId = id;
    thumbnails.appendChild(thumbnail);
}

function destroyThumbnails()
{
    let thumbnails = document.getElementById('thumbnails');
    
    while(thumbnails.firstChild)
        thumbnails.removeChild(thumbnails.lastChild);
}

// ========
// Fetching
// ========

function extractData(response) {
    let data = {
        images: []
    };

    response.images.forEach(res => {
        //res.images.forEach(image => data.images.push(image.imageURL));
        data.images.push(res.imageURL);
    });

    // change data according to the selected language
    if (language === 'ru') data.title = response.textData.ru.title;
    else data.title = response.textData.ro.title;

    // if(response.description && response.description !== '')
    //     if(language === 'ru') data.description = response.textData.ru.description;
    //     else data.description = response.textData.ro.description;
        //data.description = response.description;

    if (language === 'ru' && response.textData.ru.description !== '') data.description = response.textData.ru.description;
    else if (language === 'ro' && response.textData.ro.description !== '') data.description = response.textData.ro.description;

    data.workId = response._id;

    return data;
}

function displayWorksAfterFetching(data)
{
    if(data)
        data.forEach(work => {
            let thumbnailData = extractData(work);

            createThumbnail(thumbnailData.images, thumbnailData.title, thumbnailData.description, thumbnailData.workId);  
        });
}

async function fetchAndDisplayWorks()
{
    createLoadingDivFor(mainContainer);

    axios.get(`/api/works?lang=${language}`)
        .then(res => {
            if(res.status == 204) {
                let thumbnails = document.getElementById('thumbnails');

                // if(thumbnails.children.length > 0) {
                //     // create text to 
                // }

                noMoreFetchData = true;
            }

            if (!noMoreFetchData) {
                displayWorksAfterFetching(res.data);

                for(let target of document.getElementsByClassName('thumbnail'))
                    observeOnScroll(target);

                mainContainer.classList.remove('hidden-content');
                mainContainer.classList.add('fade-appear');
                addModalEvents();
            }

            removeLoadingDiv();
        })
        .catch(err => console.log(err));
}

async function fetchAndDisplayWorksByType(type)
{
    createLoadingDivFor(mainContainer);

    axios.get(`/api/works?lang=${language}&type=${type.toLowerCase()}`)
        .then(res => {
            if (res.status == 204) {
                let thumbnails = document.getElementById('thumbnails');

                if(thumbnails.children.length == 0) {
                    // create text to tell that there are no works of that type
                    let text = document.createElement('h1');

                    text.textContent = 'No works of this type';
                    text.classList.add('thumbnails-no-content-header');
                    thumbnails.appendChild(text);
                }

                noMoreFetchData = true;
            }

            if (!noMoreFetchData) {
                displayWorksAfterFetching(res.data);
                //target = document.getElementById('thumbnails').lastChild;
                //observeOnScroll(target, true, type);
                for(let target of document.getElementsByClassName('thumbnail'))
                    observeOnScroll(target, true, type);

                //mainContainer.style.display = 'block';
                mainContainer.classList.remove('hidden-content');
                mainContainer.scrollIntoView({ behavior: 'smooth' })
                mainContainer.classList.add('fade-appear');
                addModalEvents();
            }

            removeLoadingDiv();
        })
        .catch(err => console.log(err));
}

// unused at the moment. REFACTOR THIS !
function showFetchedWorks()
{
    //document.getElementById('thumbnails').lastChild.scrollIntoView({ behavior: 'smooth' });
    mainContainer.classList.add('fade-appear');
    addModalEvents();
}

// ==================
// Infinite scrolling
// ==================

// infinite scrolling proper functionality
function observeOnScroll(target, shouldFilter=false, type=null) {
    const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
                target.classList.remove('lazy-thumbnail');

                if (target == document.getElementById('thumbnails').lastChild)
                    if (shouldFilter && type) await fetchAndDisplayWorksByType(type);
                    else await fetchAndDisplayWorks();

                preloadMainImageOfThumbnail(entry.target);

                observer.disconnect();
            }
        });
    }, { rootMargin: '10px' });

    io.observe(target);
}

function preloadMainImageOfThumbnail(thumbnail)
{
    let image = thumbnail.getElementsByTagName('IMG')[0];

    image.src = image.getAttribute('data-src');
}

// ===============
// Filter dropdown
// ===============

// filter dropdown
filterBtn.onclick = () => { filterContent.classList.toggle('show-dropdown') }

window.onclick = event => {
    if(!event.target.matches('#dropdown-btn')) {
        let dropdowns = document.getElementsByClassName('dropdown-content');

        for(let dropdown of dropdowns) {
            if(dropdown.classList.contains('show-dropdown'))
                dropdown.classList.remove('show-dropdown');
        }
    }
};

// filter click event
for(let filter of filterContent.children)
{
    filter.onclick = () => {
        // should change work_last_date cookie to renew it when changing filter
        document.cookie = `works_last_date=${new Date(Date.now()).toISOString()}`;

        switch (filter.id) {
            case 'filter2': type = 'scari'; break;
            case 'filter3': type = 'dulapuri'; break;
            case 'filter4': type = 'scaune'; break;
            case 'filter5': type = 'usi'; break;
            case 'filter6': type = 'altele'; break;
            default: type = 'toate'; break;
        }

        noMoreFetchData = false;

        destroyThumbnails();

        if(type === 'toate') fetchAndDisplayWorks();
        else fetchAndDisplayWorksByType(type);

        document.getElementById('thumbnails').scrollIntoView({behavior: 'smooth'});
    };
}

// =======
// Loading
// =======

function createLoadingDivFor(parent)
{
    let loadingDiv = document.createElement('DIV');
    let parentDiv = document.createElement('DIV');

    loadingDiv.classList.add('loading');
    parentDiv.id = 'loading-div';

    parentDiv.appendChild(loadingDiv);
    parent.appendChild(parentDiv);
}

function removeLoadingDiv()
{
    //document.getElementsByClassName('loading')[0].remove();
    document.getElementById('loading-div').remove();
}

// =========
// Languages
// =========

// language integration code
var language = 'ro'; //default language
var romanianBtn = document.getElementById('romanian_language');
var russianBtn = document.getElementById('russian_language');
// let buttons change language according to lang attribute

function hideContentInLanguage(language) {
    if(language !== 'ru') language = 'ro';

    document.querySelectorAll(`[lang=${language}]`).forEach(element => {
        element.classList.add('hidden-content');
    });
}

function showContentInLanguage(language) {
    if(language !== 'ru') language = 'ro';

    document.querySelectorAll(`[lang=${language}]`).forEach(element => {
        element.classList.remove('hidden-content');
    });
}

function changeHTMLLang(language) {
    document.querySelector('html').lang = language;
}

[russianBtn, romanianBtn].forEach(btn => {
    btn.onclick = () => {
        if(btn === russianBtn) {
            language = 'ru';

            hideContentInLanguage('ro');
            changeHTMLLang(language);
            showContentInLanguage('ru');
            document.getElementById('languages-language').textContent = 'Русский';
        }
        else {
            language = 'ro';

            hideContentInLanguage('ru');
            changeHTMLLang(language);
            showContentInLanguage('ro');
            document.getElementById('languages-language').textContent = 'Română';
        }

        document.getElementById('info').scrollIntoView({behavior: 'smooth'});
        destroyThumbnails();
        mainContainer.classList.add('hidden-content');
        mainContainer.classList.remove('fade-appear');
    };
});

// languages dropdown
let languagesDropdownContent = document.getElementById('language-dropdown-content');
let languagesDropdown = document.getElementById('languages');

languagesDropdown.onclick = () => {
    languagesDropdownContent.classList.toggle('hidden-content');
    document.getElementById('languages-language-icon').classList.toggle('cadet-sign-transition');
};
