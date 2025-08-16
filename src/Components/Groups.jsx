import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import styles from "./group.module.css";
import cross from "../assets/cross.svg";
const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [paidBy, setPaidBy] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splitBetween, setSplitBetween] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [owesList, setOwesList] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [flag, setFlag] = useState(true);
  const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  // 1️⃣ Try request with current access token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  // 2️⃣ If token expired, try refreshing
  if (response.status === 403 && refreshToken) {
    const refreshRes = await fetch("http://localhost:5000/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("accessToken", data.accessToken);

      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } else {
      alert("Session expired, please log in again.");
      localStorage.clear();
      window.location.href = "/";
      return { ok: false, status: 403, data: null };
    }
  }

  // 3️⃣ Always safely parse JSON (or return null if no JSON body)
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null; // fallback if no JSON
  }

  return { ok: response.ok, status: response.status, data };
};


    useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:5000/api/groups");
        setGroups(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching groups:", err);
        setGroups([]);
      }
    };
    fetchGroups();
  }, []);


  const handleGroupClick = (group) => {
    setFlag(false)
    setSelectedGroup(group);
    setPaidBy("");
    setSplitBetween([]);
    setSelectAll(false);
    setDescription("");
    setAmount("");
    setExpenses([]);
    setOwesList([]);
    setShowSummary(false);
  };

  const handleSelectAll = (checked, participants) => {
    setSelectAll(checked);
    if (checked) {
      setSplitBetween(participants);
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
    if (!selectedGroup) return alert("Please select a group first.");
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
      alert("Please fill all fields before adding expense.");
      return;
    }

    const expenseData = {
      groupId: selectedGroup._id.toString(),
      description,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
    };

    try {
      const response = await fetchWithAuth("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error("Failed to add expense");
      }

      alert("Expense added successfully!");
      setDescription("");
      setAmount("");
      setPaidBy("");
      setSplitBetween([]);
      setSelectAll(false);
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

    const handleViewSummary = async () => {
    try {
     const res = await fetchWithAuth(`http://localhost:5000/api/expenses/${selectedGroup._id}`);
     setOwesList(Array.isArray(res.data) ? res.data : []);
      setShowSummary(true);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const handlecross = ()=>{
    setShowSummary(false);
  }


  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.container}>
        {flag && (
          <ul className={styles.groupList}>
            {groups.length > 0 ? (
              groups.map((group, index) => (
                <li
                  key={group._id || index}
                  className={styles.groupItem}
                  onClick={() => handleGroupClick(group)}
                >
                  {group.title}
                </li>
              ))
            ) : (
              <p>No groups found.</p>
            )}
          </ul>
        )}


        {selectedGroup && !flag && !showSummary &&(
          <div className={styles.second_container}>
            <div className={styles.selected}>
              {selectedGroup.title}
            </div>
            <div className={styles.addExpense}>

              <div>
                Description:{" "}
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                Amount:{" "}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <select
                  value={paidBy}
                  onChange={(e) => {
                    setPaidBy(e.target.value);
                    setSplitBetween([]);
                    setSelectAll(false);
                  }}
                >
                  <option value="">Select payer</option>
                  {(selectedGroup.participants || []).map((p, index) => (
                    <option key={index} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {paidBy && (
                <div className={styles.splitBetween_list}>
                  <p>Split Between:</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) =>
                        handleSelectAll(
                          e.target.checked,
                          (selectedGroup.participants || []).filter((p) => p !== paidBy)
                        )
                      }
                    />
                    Everyone
                  </label>
                  {(selectedGroup.participants || [])
                    .filter((p) => p !== paidBy)
                    .map((participant, index) => (
                      <label key={index} style={{ display: "block" }}>
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
          </div>

        )}
        {selectedGroup && !flag && !showSummary &&(
          <div className={styles.buttons}>
            <button onClick={handleViewSummary}>View Summary</button>
            <button onClick={handleAddExpense}>Add Expense</button>
          </div>
        )}
        
        {selectedGroup && showSummary && (
          <>
          <div className={styles.cross}>
            <img onClick={handlecross} src={cross} alt="" />
          </div>
        <div className={styles.summary}>
          
          <div className={styles.selected}>
              {selectedGroup.title}
            </div>
          <ul>
            {Array.isArray(owesList) && owesList.map(item => (
              <div key={`${item.from}-${item.to}`}>
                {item.from} owes {item.to} ₹{item.amount}
              </div>
            ))}
          </ul>
          
        </div>
        </>
      )}
      </div>




      
    </div>
  );
};

export default Groups;
