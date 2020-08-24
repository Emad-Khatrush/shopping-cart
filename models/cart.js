module.exports = function Cart(oldCart){
  this.items = oldCart.items || {};
  this.totalPrice = oldCart.totalPrice || 0;
  this.totalQty = oldCart.totalQty || 0;

  this.add = function(item, id){
    var storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = {item: item, qty: 0, price: 0};
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.price;
  };
  this.addOrReduce = function(id, qty){
    if (this.items[id].qty < qty) {
      this.items[id].qty++;
      this.items[id].price += this.items[id].item.price;
      this.totalQty++;
      this.totalPrice += this.items[id].item.price;
    }else {
      this.items[id].qty--;
      this.items[id].price -= this.items[id].item.price;
      this.totalQty--;
      this.totalPrice -= this.items[id].item.price;
    }

  };

  this.productDelete = function(id){
    this.totalQty -= this.items[id].qty;
    this.totalPrice -= this.items[id].price;
    delete this.items[id];
  };

  this.generateArray = function(){
    var arr = [];
    for(var id in this.items){
      arr.push(this.items[id]);
    }
    return arr;
  };
}
