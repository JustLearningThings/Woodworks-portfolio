var table = document.getElementById('content-list-table');
var loadContentBtn = document.getElementById('load-content-btn');
var rowCounter = 0; // used for giving ids to table rows

// modal variables
var modal = document.getElementById('modal');
var modalContent = document.getElementById('modal-content');
var modalBtn = document.getElementById('modal-btn');
var close = document.getElementById('close');

// both arguments should be 2 element arrays, first will be in
// romanian, second - in russian
function createTableRow(title, description, images, views, id)
{
    let row = document.createElement('TR');
    let rowContent = [];

    // add id to row as to remove it from DOM when needed (it is needed mainly when deleting a work)
    row.id = `table-row-${rowCounter}`;
    let currentRow = rowCounter;
    rowCounter++;

    for(let i = 0; i < 5; i++)
        rowContent.push(document.createElement('TD'));

    // row content: 1 - title,2 - images, 3 - description, 4 - buttons
    let russianTitle = '', russianDescription = '';
    //if(title[1] !== '' && description[1] != '') {
        russianTitle = `(${title[1]})`;
        if(description[1]) russianDescription = `(${description[1]})`;
        //else russianDescription = '';
    //}

    rowContent[0].textContent = `${title[0]} ${russianTitle}`;
    rowContent[2].textContent = `${description[0]} ${russianDescription}`;

    // images column
    images.forEach(image => {
        let link = document.createElement('a');
        let remove = document.createElement('span');
        let imageDiv = document.createElement('div');

        link.classList.add('link-to-image');
        link.href = `/${image.imageURL}`;
        link.textContent = image.fileName;
        link.id = image.fileName;

        remove.textContent = 'x';
        remove.onclick = () => { showModal(image, id) };

        imageDiv.classList.add('images-column-div');

        imageDiv.appendChild(link);
        imageDiv.appendChild(remove);
        rowContent[1].appendChild(imageDiv);
    });

    rowContent[1].classList.add('images-column');

    rowContent[3].textContent = views;
    rowContent[3].classList.add('views-column');

    let editButton = document.createElement('a');
    let deleteButton = document.createElement('button');

    editButton.classList.add('edit-btn');
    deleteButton.classList.add('delete-btn');

    editButton.textContent = 'Editează';
    deleteButton.textContent = 'Șterge';

    // add event for delete button
    // edit button will just redirect to the editing form page
    deleteButton.onclick = () => {
        axios.delete(`/api/works/${id}`)
        .then(() => {
            document.getElementById(`table-row-${currentRow}`).remove();
        });
    };

    editButton.href = `/edit/${id}`;

    rowContent[4].appendChild(editButton);
    rowContent[4].appendChild(deleteButton);
    rowContent[4].classList.add('actions-column');

    rowContent.forEach(content => { row.appendChild(content) });
    table.appendChild(row);
}

// modal for image removal
function showModal(image, workId) {
    modal.style.display = 'flex';
    modalContent.classList.add('modal-content-appear');

    // remove image from db
    modalBtn.onclick = () => { 
        axios.delete(`/api/works/${workId}?imgs[]=${image._id}`)
        .then(() => {
            closeModal();
            document.getElementById(image.fileName).parentNode.remove();
        })
        .catch(err => console.log(err));
    }
}

function closeModal() {
    modal.style.display = 'none';
    modalContent.classList.remove('modal-content-appear');
}

function addModalCloseEvent() {
    close.onclick = () => closeModal();
    window.onclick = e => {
        if(modal.style.display !== 'none' && e.target == modal)
            closeModal();
    };
}

function loadContent() {
    axios.get('/api/works?filter=false')
    .then(res => {
        if (res.status == 204) loadContentBtn.remove();
    console.log(res.data);
        if (res.data && res.data.length > 0) {
            res.data.forEach(work => {
                createTableRow(
                    [work.textData.ro.title, work.textData.ru.title],
                    [work.textData.ro.description, work.textData.ru.description],
                    work.images,
                    work.views,
                    work._id
                );
            });
        }
    })
}

window.addEventListener('DOMContentLoaded', () => {
    loadContentBtn.onclick = loadContent;  
    document.cookie = `works_last_date=${new Date(Date.now()).toISOString()}`;

    loadContent();
    addModalCloseEvent();
});
