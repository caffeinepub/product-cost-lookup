import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Order "mo:core/Order";

actor {
  type Product = {
    sku : Text;
    name : Text;
    cost : Float;
    description : ?Text;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.sku, p2.sku);
    };
  };

  let products = Map.empty<Text, Product>();

  // Custom toText and comparison for product
  public query ({ caller }) func toText(product : Product) : async Text {
    product.name;
  };

  public shared ({ caller }) func addProduct(sku : Text, name : Text, cost : Float, description : ?Text) : async () {
    if (products.containsKey(sku)) {
      Runtime.trap("Product already exists: " # sku);
    };
    let product : Product = {
      sku;
      name;
      cost;
      description;
    };
    products.add(sku, product);
  };

  public shared ({ caller }) func updateProduct(sku : Text, name : Text, cost : Float, description : ?Text) : async () {
    switch (products.get(sku)) {
      case (null) {
        Runtime.trap("Product does not exist: " # sku);
      };
      case (?_) {
        let updatedProduct : Product = {
          sku;
          name;
          cost;
          description;
        };
        products.add(sku, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(sku : Text) : async () {
    switch (products.get(sku)) {
      case (null) {
        Runtime.trap("Product does not exist: " # sku);
      };
      case (?_) {
        products.remove(sku);
      };
    };
  };

  public query ({ caller }) func getProductBySKU(sku : Text) : async Product {
    switch (products.get(sku)) {
      case (null) {
        Runtime.trap("Product does not exist: " # sku);
      };
      case (?product) { product };
    };
  };

  public query ({ caller }) func searchProductsByName(searchTerm : Text) : async [Product] {
    products.values().toArray().filter(
      func(product) {
        product.name.toLower().contains(#text(searchTerm));
      }
    );
  };

  public query ({ caller }) func listAllProducts() : async [Product] {
    products.values().toArray();
  };

  // Seed with sample products
  public shared ({ caller }) func seedSampleData() : async () {
    let sampleProducts : [(Text, Product)] = [
      (
        "SKU123",
        {
          sku = "SKU123";
          name = "Mocha Mug";
          cost = 12.99;
          description = ?"A stylish ceramic mug for coffee lovers.";
        },
      ),
      (
        "SKU456",
        {
          sku = "SKU456";
          name = "Wireless Headphones";
          cost = 89.95;
          description = ?"High-quality over-ear headphones.";
        },
      ),
      (
        "SKU789",
        {
          sku = "SKU789";
          name = "Notebook Set";
          cost = 7.5;
          description = ?""; // Empty description
        },
      ),
    ];
    for ((sku, product) in sampleProducts.values()) {
      products.add(sku, product);
    };
  };

  public query ({ caller }) func containsProduct(sku : Text) : async Bool {
    products.containsKey(sku);
  };

  public query ({ caller }) func getProductCount() : async Nat {
    products.size();
  };
};
