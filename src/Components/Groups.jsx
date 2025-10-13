import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import styles from "./group.module.css";
import cross from "../assets/cross.svg";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [owesList, setOwesList] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [flag, setFlag] = useState(true);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const data = await fetchWithAuth("http://localhost:5000/api/groups");
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupClick = (group) => {
    setFlag(false);
    setSelectedGroup(group);
    setPaidBy("");
    setSplitBetween([]);
    setSelectAll(false);
    setDescription("");
    setAmount("");
    setOwesList([]);
    setShowSummary(false);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked && selectedGroup) {
      const others = (selectedGroup.participants || []).filter((p) => p !== paidBy);
      setSplitBetween(others);
    } else {
      setSplitBetween([]);
    }
  };

  const handleCheckboxChange = (participant) => {
    setSplitBetween((prev) =>
      prev.includes(participant)
        ? prev.filter((p) => p !== participant)
        : [...prev, participant]
    );
  };

  const handleAddExpense = async () => {
    if (!selectedGroup || !description || !amount || !paidBy || splitBetween.length === 0) {
      return alert("Please fill all fields.");
    }

    const expenseData = {
      groupId: selectedGroup._id?.toString(),
      description,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
    };

    try {
      const data = await fetchWithAuth("http://localhost:5000/api/expenses", {
        method: "POST",
        body: JSON.stringify(expenseData),
      });

      if (data?.id) {
        alert("Expense added successfully!");
        setDescription("");
        setAmount("");
        setPaidBy("");
        setSplitBetween([]);
        setSelectAll(false);
      } else {
        alert(data?.error || "Failed to add expense");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while adding expense.");
    }
  };

  const handleViewSummary = async () => {
    try {
      const data = await fetchWithAuth(`http://localhost:5000/api/expenses/${selectedGroup._id}`);
      setOwesList(Array.isArray(data) ? data : []);
      setShowSummary(true);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      const data = await fetchWithAuth(`http://localhost:5000/api/groups/${selectedGroup._id}`, {
        method: "DELETE",
      });

      if (data?.message || data?.deletedCount) {
        alert("Group deleted successfully!");
        setSelectedGroup(null);
        setFlag(true);
        fetchGroups();
      } else {
        alert(data?.error || "Failed to delete group");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting group.");
    }
  };

  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.container}>
        {flag && (
          <ul className={styles.groupList}>
            {groups.length > 0 ? (
              groups.map((group) => (
                <li key={group._id} className={styles.groupItem} onClick={() => handleGroupClick(group)}>
                  {group.title}
                </li>
              ))
            ) : (
              <p>No groups found.</p>
            )}
          </ul>
        )}

        {selectedGroup && !showSummary && (
          <div className={styles.card}>
            <h2 className={styles.selected}>{selectedGroup.title}</h2>
            <button className={styles.deleteBtn} onClick={handleDeleteGroup}>Delete Group</button>

            <div className={styles.addExpense}>
              <label>
                Description
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner, Tickets"
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                />
              </label>

              <label>
                Paid By
                <select
                  value={paidBy}
                  onChange={(e) => {
                    setPaidBy(e.target.value);
                    setSplitBetween([]);
                    setSelectAll(false);
                  }}
                >
                  <option value="">Select payer</option>
                  {(selectedGroup.participants || []).map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {paidBy && (
                <div className={styles.splitBetween}>
                  <p>Split Between</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    Everyone
                  </label>
                  {(selectedGroup.participants || [])
                    .filter((p) => p !== paidBy)
                    .map((participant, i) => (
                      <label key={i}>
                        <input
                          type="checkbox"
                          checked={splitBetween.includes(participant)}
                          onChange={() => handleCheckboxChange(participant)}
                        />
                        {participant}
                      </label>
                    ))}
                </div>
              )}
            </div>

            <div className={styles.buttons}>
              <button onClick={handleViewSummary}>View Summary</button>
              <button onClick={handleAddExpense}>Add Expense</button>
            </div>
          </div>
        )}

        {selectedGroup && showSummary && (
          <div className={styles.summary}>
            <div className={styles.cross}>
              <img onClick={() => setShowSummary(false)} src={cross} alt="Close" />
            </div>
            <h2 className={styles.selected}>{selectedGroup.title}</h2>
            <ul>
              {owesList.length > 0 ? (
                owesList.map((item) => (
                  <li key={`${item.from}-${item.to}`}>
                    <strong>{item.from}</strong> owes <strong>{item.to}</strong> ₹{item.amount}
                  </li>
                ))
              ) : (
                <p>No balances yet.</p>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
