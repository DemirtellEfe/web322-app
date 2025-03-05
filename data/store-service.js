let items = [];  

function addItem(itemData) {
    return new Promise((resolve) => {
        itemData.published = itemData.published === "on";
        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
}

function getAllItems() {
    return items;
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category === category);
        filteredItems.length > 0 ? resolve(filteredItems) : reject("no results returned");
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        filteredItems.length > 0 ? resolve(filteredItems) : reject("no results returned");
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === parseInt(id));
        item ? resolve(item) : reject("no result returned");
    });
}

module.exports = { addItem, getAllItems, getItemsByCategory, getItemsByMinDate, getItemById };
