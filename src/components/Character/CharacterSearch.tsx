"use client";

import React, { useState } from "react";
import "./styles/CharacterSearch.css";

interface CharacterSearchProps {
  onSearch: (searchTerm: string) => void;
  onFilterRole: (role: string) => void;
  onSort: (sortBy: string, order: "asc" | "desc") => void;
}

export default function CharacterSearch({
  onSearch,
  onFilterRole,
  onSort,
}: CharacterSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setRoleFilter(role);
    onFilterRole(role);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortField = e.target.value;
    setSortBy(sortField);
    onSort(sortField, sortOrder);
  };

  const handleSortOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const order = e.target.value as "asc" | "desc";
    setSortOrder(order);
    onSort(sortBy, order);
  };

  return (
    <div className="character-search">
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <select value={roleFilter} onChange={handleRoleFilter}>
        <option value="all">All Roles</option>
        <option value="protagonist">Protagonist</option>
        <option value="antagonist">Antagonist</option>
        <option value="supporting">Supporting</option>
      </select>
      <select value={sortBy} onChange={handleSort}>
        <option value="date">Date Created</option>
        <option value="name">Name</option>
      </select>
      <select value={sortOrder} onChange={handleSortOrder}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  );
}