import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Char "mo:core/Char";

actor {
  type Product = {
    sku : Text;
    name : Text;
    cost : Float;
    description : ?Text;
  };

  let products = Map.empty<Text, Product>();
  var nextId = 0;
  let temporaryClearingList = List.empty<Text>();

  func trimText(input : Text) : Text {
    let chars = input.toArray();
    let filteredChars = chars.filter(func(c) { not c.isWhitespace() });
    Text.fromArray(filteredChars);
  };

  func makeKey(sku : Text) : Text {
    let trimmedSku = trimText(sku);
    if (trimmedSku.isEmpty()) {
      let newId = "__id_" # nextId.toText();
      nextId += 1;
      newId;
    } else {
      trimmedSku;
    };
  };

  // Upsert helper: remove existing key if present, then add
  func upsert(key : Text, product : Product) {
    if (products.containsKey(key)) {
      products.remove(key);
    };
    products.add(key, product);
  };

  func validateProductInfo(sku : Text, name : Text, cost : Float) {
    let trimmedSku = trimText(sku);
    let trimmedName = trimText(name);

    let skuEmpty = trimmedSku.isEmpty();
    let nameEmpty = trimmedName.isEmpty();

    if (skuEmpty and nameEmpty) {
      Runtime.trap("Either SKU or product name must be provided (not both)");
    };

    if (cost < 0.0 and cost != -1.0) {
      Runtime.trap("Cost cannot be negative");
    };
  };

  public shared ({ caller }) func addProduct(sku : Text, name : Text, cost : Float, description : ?Text) : async () {
    validateProductInfo(sku, name, cost);
    let key = makeKey(sku);
    let product : Product = {
      sku = key;
      name;
      cost;
      description;
    };
    upsert(key, product);
  };

  public shared ({ caller }) func updateProduct(sku : Text, name : Text, cost : Float, description : ?Text) : async () {
    validateProductInfo(sku, name, cost);
    let key = trimText(sku);
    let updatedProduct : Product = {
      sku = key;
      name;
      cost;
      description;
    };
    upsert(key, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(sku : Text) : async () {
    let key = trimText(sku);
    switch (products.get(key)) {
      case (null) { Runtime.trap("Product does not exist: " # key) };
      case (?_) {
        products.remove(key);
      };
    };
  };

  public query ({ caller }) func getProductBySKU(sku : Text) : async Product {
    let key = trimText(sku);
    switch (products.get(key)) {
      case (null) { Runtime.trap("Product does not exist: " # key) };
      case (?product) { product };
    };
  };

  // Searches both product name AND SKU for the given term (case-insensitive, partial match)
  public query ({ caller }) func searchProductsByName(searchTerm : Text) : async [Product] {
    let lowerSearchTerm = searchTerm.toLower();
    let filtered = products.values().toArray().filter(func(product) {
      product.name.toLower().contains(#text(lowerSearchTerm)) or
      product.sku.toLower().contains(#text(lowerSearchTerm))
    });
    filtered;
  };

  public query ({ caller }) func listAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getProductCount() : async Nat {
    products.size();
  };

  public query ({ caller }) func containsProduct(sku : Text) : async Bool {
    products.containsKey(trimText(sku));
  };

  public shared ({ caller }) func bulkImportProducts(productsArray : [Product]) : async () {
    for (p in productsArray.values()) {
      let key = makeKey(p.sku);
      let stored : Product = {
        sku = key;
        name = p.name;
        cost = p.cost;
        description = p.description;
      };
      upsert(key, stored);
    };
  };

  public shared ({ caller }) func seedSampleData() : async () {
    let sampleProducts : [Product] = [
      {
        sku = "SKU123";
        name = "Mocha Mug";
        cost = 12.99;
        description = ?"A stylish ceramic mug for coffee lovers.";
      },
      {
        sku = "SKU456";
        name = "Wireless Headphones";
        cost = 89.95;
        description = ?"High-quality over-ear headphones.";
      },
      {
        sku = "SKU789";
        name = "Notebook Set";
        cost = 7.5;
        description = ?"";
      },
    ];
    await bulkImportProducts(sampleProducts);
  };

  public shared ({ caller }) func clearAllProducts() : async () {
    products.forEach(
      func(key, _product) {
        temporaryClearingList.add(key);
      }
    );
    temporaryClearingList.values().forEach(
      func(key) {
        products.remove(key);
      }
    );
    temporaryClearingList.clear();
    nextId := 0;
  };
};
