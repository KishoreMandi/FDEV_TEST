const Leaderboard = ({ data }) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        🏆 Leaderboard
      </h2>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Rank</th>
            <th className="p-2">Student</th>
            <th className="p-2">Score</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={row.rank}
              className={`border-t ${
                row.isYou
                  ? "bg-green-100 font-semibold"
                  : ""
              }`}
            >
              <td className="p-2">#{row.rank}</td>
              <td className="p-2">
                {row.name}
                {row.isYou && (
                  <span className="ml-2 text-xs text-green-700">
                    (You)
                  </span>
                )}
              </td>
              <td className="p-2">{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
