"use client";
import React, { useEffect, useState } from "react";
import "./page.css"; // CSSファイルをインポート

type Ticket = {
  id: number;
  ticket_number: string;
  number_of_people: number;
  status: string;
};

const getNextTicketNumber = (tickets: Ticket[]): string => {
  if (tickets.length === 0) return "01"; // 最初の整理券番号
  // statusが"Done"以外の整理券番号を抽出
  const activeNumbers = tickets
    .filter((t) => t.status !== "終了")
    .map((t) => Number(t.ticket_number));
  // ID
  const maxNumber = activeNumbers[activeNumbers.length - 1]
  const nextNumber = maxNumber < 80 ?  maxNumber + 1 : 1;


  // 2桁ゼロ埋め
  return nextNumber.toString().padStart(2, "0");
};



const TicketListPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [updateTicketID, setUpdateTicketID] = useState<number>(0);
  const [deleteTicketID, setDeleteTicketID] = useState<number>(0);
  const [updateStatus, setUpdateStatus] = useState<string>("未呼び出し");

  //整理券テーブル初期化処理を関数化
  const handleInitializeTickets = async () => {
    const result = window.confirm('本当にテーブルを初期化しますか？\n全てのデータが削除されます');
    if (!result) return; // キャンセルされた場合は処理を中止
    try {
      const res = await fetch(
        "https://staff-backend-orpin.vercel.app/api/tickets/clear",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-vercel-protection-bypass": process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS ?? "",
          },
        }
      );
      if (!res.ok) throw new Error("テーブル初期化に失敗しました");

      window.location.reload();
    } catch (err: unknown) {
      setSuccessMessage(""); // 失敗時はメッセージを消す
      alert(
        err instanceof Error
          ? err.message
          : "不明なエラーが発生しました"
      );
    }
  };

  // 整理券発行処理を関数化
  const handleCreateTicket = async () => {
    try {
      const res = await fetch(
        "https://staff-backend-orpin.vercel.app/api/ticket",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-vercel-protection-bypass": process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS ?? "",
          },
          body: JSON.stringify({
            ticket_number: ticketNumber,
            number_of_people: numberOfPeople,
            status: "未呼び出し",
          }),
        }
      );
      if (!res.ok) throw new Error("整理券発行に失敗しました");

      
      window.location.reload();
    } catch (err: unknown) {
      setSuccessMessage(""); // 失敗時はメッセージを消す
      alert(
        err instanceof Error
          ? err.message
          : "不明なエラーが発生しました"
      );
    }
  };

  const handleUpdateStatus = async () => {
    let updateNumberOfPeople = 0;
    let updateTicketNumber = "";
    for (const ticket of tickets) {
      if (ticket.id === updateTicketID) {
        // 更新対象の整理券が見つかった場合 
        updateTicketNumber = ticket.ticket_number;
        updateNumberOfPeople = ticket.number_of_people;
        break;
      }
    }
    if (updateTicketNumber === "") {
      alert("指定された整理券IDが見つかりません");
      return;
    }
    try {
      console.log("Updating ticket:", {
        id: updateTicketID,
        ticket_number: updateTicketNumber,
        number_of_people: updateNumberOfPeople,
        status: updateStatus,
      });
      const res = await fetch(
        `https://staff-backend-orpin.vercel.app/api/ticket/${updateTicketID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-vercel-protection-bypass": process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS ?? "",
          },
          body: JSON.stringify({
            ticket_number: updateTicketNumber,
            number_of_people: updateNumberOfPeople,
            status: updateStatus,
          }),
        }
      );
      if (!res.ok) throw new Error("ステータス更新に失敗しました");
  
      window.location.reload();
    } catch (err: unknown) {
      setSuccessMessage("");
      alert(
        err instanceof Error
          ? err.message
          : "不明なエラーが発生しました"
      );
    }
  };

  const ticketsHardDelete = async () => {
    const result = window.confirm('本当に削除しますか？\n行番号: ' + deleteTicketID);
    if (!result) return; // キャンセルされた場合は処理を中止
    try {
      const res = await fetch(
        "https://staff-backend-orpin.vercel.app/api/ticket/" + deleteTicketID,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-vercel-protection-bypass": process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS ?? "",
          },
        }
      );
      if (!res.ok) throw new Error("整理券発行に失敗しました");

      window.location.reload();
    } catch (err: unknown) {
      setSuccessMessage(""); // 失敗時はメッセージを消す
      alert(
        err instanceof Error
          ? err.message
          : "不明なエラーが発生しました"
      );
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(
          "https://staff-backend-orpin.vercel.app/api/tickets",
          {
            method: "GET",
            headers: {
              "accept": "application/json",
              "x-vercel-protection-bypass": process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS ?? "",
            },
          }
        );
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data: Ticket[] = await res.json();
        // ✅ ID昇順にソート
        const sortedTickets = data.sort((a, b) => a.id - b.id);

        setTickets(sortedTickets);
        // 整理券番号の初期値をセット
        setTicketNumber(getNextTicketNumber(sortedTickets));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("不明なエラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div  className="ticket-page">
      <div className="ticket-list">
        <h1>整理券一覧</h1>
        <ul>
          <div className="ticket-id-header">
            <div>行番号</div>
            <div>整理券番号</div>
            <div>人数</div>
            <div>ステータス</div>
          </div>
          {tickets.map((ticket) => (
            <li 
              key={ticket.id} 
              className="ticket-row" 
              onClick={() => setUpdateTicketID(ticket.id)}
              title="クリックで選択"
            >
              <div>{ticket.id}</div>
              <div>{ticket.ticket_number}</div>
              <div>{ticket.number_of_people}</div>
              <div>{ticket.status}</div>
            </li>
          ))}
        </ul>
        <button onClick={handleInitializeTickets}>
          テーブル初期化
        </button>
      </div>
      <div className="form-section">
        {/* 整理券発行フォーム */}
        <h1>整理券発行</h1>
        <div className="create-ticket-form">
          <label>
            整理券番号
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="00"
            />
          </label>
          <label className="number-input-label">
            人数
            <div className="number-input-wrapper">
              <input
                type="text"
                className="number-input"
                value={numberOfPeople}
                disabled={false}
                onChange={(e) => {
                  const value = e.target.value;
                  const num = parseInt(value, 10);
                  if (!isNaN(num) && num >= 1) {
                    setNumberOfPeople(num);
                  } else {
                    setNumberOfPeople(1);
                  }
                }}
              />
              <button
                type="button"
                className="number-button"
                onClick={() => setNumberOfPeople((prev) => Number(prev) + 1)}
              >
                ＋
              </button>
              <button
                type="button"
                className="number-button"
                onClick={() => setNumberOfPeople((prev) => Math.max(1, prev - 1))}
              >
                −
              </button>
            </div>
          </label>
          <button onClick={handleCreateTicket}>
            整理券発行
          </button>
        </div>
        {/* 更新フォーム */}
        <h1>整理券更新</h1>
        <div className="update-ticket-form">
          <label>
            行番号
            <input
              type="number"
              value={updateTicketID}
              min={1}
              onChange={(e) => setUpdateTicketID(Number(e.target.value))}
            />
          </label>
          <label>
            ステータス
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
            >
              <option value="未呼び出し">未呼び出し</option>
              <option value="呼び出し中">待合室呼び出し中</option>
              <option value="待合室">待合室</option>
              <option value="終了">終了</option>
            </select>
          </label>
          <button onClick={handleUpdateStatus}>
            更新
          </button>
        </div>
        {/* 削除フォーム */}
        <h1>整理券削除</h1>
        <div className="delete-ticket-form">
          <label>
            行番号
            <input
              type="number"
              value={deleteTicketID}
              onChange={(e) => setDeleteTicketID(Number(e.target.value))}
            />
          </label>
          <button onClick={ticketsHardDelete}>
            削除
          </button>
        </div>
        {/* 成功メッセージ表示 */}
        {successMessage && (
          <div>
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketListPage;