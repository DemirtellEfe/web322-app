let items = [];  
let categories = [
    { id: 1, name: "Action" },
    { id: 2, name: "Adventure" },
    { id: 3, name: "RPG" },
    { id: 4, name: "Strategy" },
    { id: 5, name: "Simulation" }
];

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.id = items.length + 1;
        itemData.postDate = new Date().toISOString().split("T")[0];
        itemData.published = (itemData.published) ? true : false;

        if (itemData.category && !categories.find(c => c.name === itemData.category)) {
            categories.push({
                id: categories.length + 1,
                name: itemData.category
            });
        }

        items.push(itemData);
        resolve(itemData);
    });
}


function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No items found");
        }
    });
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
        let foundItem = items.find(item => item.id == id);
        if (foundItem) {
            resolve(foundItem);
        } else {
            reject("Item not found");
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No categories found");
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve) => {
        console.log("Fetching published items...");
        
        const publishedItems = items.filter(item => item.published === true);
        
        if (publishedItems.length > 0) {
            console.log("Published items found:", publishedItems);
        } else {
            console.warn("No published items found, returning empty array.");
        }

        resolve(publishedItems); 
    });
}




module.exports = { addItem, getAllItems, getItemsByCategory, getItemsByMinDate, getItemById, getCategories, getPublishedItems };
