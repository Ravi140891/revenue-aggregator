import React, { useState, useMemo, useCallback, useEffect } from "react";
import "./App.css";

const ITEMS_PER_PAGE = 10;

function App() {
  const [branchData, setBranchData] = useState([]);

  const formatNumber = (number) => {
    const numString = number.toFixed(2);
    const [integerPart, decimalPart] = numString.split(".");

    let formattedInteger = "";
    for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
      if (count === 3) {
        formattedInteger = "," + formattedInteger;
        count = 0;
      }
      formattedInteger = integerPart[i] + formattedInteger;
    }

    const formattedDecimal = decimalPart ? decimalPart : "00";

    return decimalPart
      ? formattedInteger + "." + formattedDecimal
      : formattedInteger;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await fetch("/api/branch1.json");
        const data1 = await response1.json();

        const response2 = await fetch("/api/branch2.json");
        const data2 = await response2.json();

        const response3 = await fetch("/api/branch3.json");
        const data3 = await response3.json();

        const mergedData = [
          ...data1.products,
          ...data2.products,
          ...data3.products,
        ];

        setBranchData(mergedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const allProducts = useMemo(() => branchData, [branchData]);

  const productRevenueMap = useMemo(() => {
    return allProducts.reduce((acc, product) => {
      const existingProduct = acc.get(product.name);
      if (existingProduct) {
        existingProduct.revenue += product.unitPrice * product.sold;
      } else {
        acc.set(product.name, {
          name: product.name,
          revenue: product.unitPrice * product.sold,
        });
      }
      return acc;
    }, new Map());
  }, [allProducts]);

  const productsWithTotalRevenue = useMemo(
    () => Array.from(productRevenueMap.values()),
    [productRevenueMap]
  );

  const [filter, setFilter] = useState("");

  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);

  const [viewAll, setViewAll] = useState(false);

  const handleFilterChange = useCallback((event) => {
    setFilter(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((event) => {
    setSortOrder(event.target.value);
  }, []);

  const handleViewAllClick = useCallback(() => {
    setViewAll((prevViewAll) => !prevViewAll);
    setCurrentPage(1);
  }, []);

  const sortedProducts = useMemo(() => {
    const filteredData = productsWithTotalRevenue.filter((product) =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );

    const sortedData = [...filteredData].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return sortedData;
  }, [filter, productsWithTotalRevenue, sortOrder]);

  const totalPages = viewAll
    ? 1
    : Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

  const range = 4;
  let startPage = Math.max(currentPage - Math.floor(range / 2), 1);
  let endPage = Math.min(startPage + range - 1, totalPages);

  if (endPage - startPage + 1 < range) {
    startPage = Math.max(endPage - range + 1, 1);
  }

  const indexOfLastItem = viewAll
    ? sortedProducts.length
    : currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = viewAll ? 0 : indexOfLastItem - ITEMS_PER_PAGE;

  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  const totalRevenue = sortedProducts.reduce(
    (acc, product) => acc + product.revenue,
    0
  );

  return (
    <div className="App">
      <h1>Revenue Aggregator</h1>
      <label htmlFor="search">Search: </label>
      <input
        type="text"
        id="search"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Filter by product name"
      />
      <label htmlFor="sort">Sort by: </label>
      <select
        id="sort"
        value={sortOrder}
        onChange={handleSortChange}
        style={{ padding: "5px 10px" }}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
      <button className="view-all-button" onClick={handleViewAllClick}>
        {viewAll ? "View Paginated" : "View All"}
      </button>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((product) => (
            <tr key={product.name}>
              <td>{product.name}</td>
              <td>${formatNumber(product.revenue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="green">${formatNumber(totalRevenue)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="pagination">
        {currentPage > 1 && (
          <span
            className="page-link"
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            &laquo; Prev
          </span>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
          <span
            key={startPage + index}
            className={`page-link ${
              currentPage === startPage + index ? "active" : ""
            }`}
            onClick={() => setCurrentPage(startPage + index)}
          >
            {startPage + index}
          </span>
        ))}
        {currentPage < totalPages && (
          <span
            className="page-link"
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next &raquo;
          </span>
        )}
      </div>
    </div>
  );
}

export default App;
