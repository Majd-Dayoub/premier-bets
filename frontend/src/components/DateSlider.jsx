import dayjs from "dayjs";

export default function DateSlider({ dateKeys, selectedDate, onSelectDate }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-700">Select a date</div>
        <div className="text-sm text-gray-600">
          {selectedDate ? dayjs(selectedDate).format("dddd, MMM D") : ""}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {dateKeys.map((dateKey) => {
          const isActive = dateKey === selectedDate;
          const d = dayjs(dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={[
                "flex-shrink-0 rounded-xl border px-4 py-2 text-left",
                "min-w-[84px] transition",
                isActive
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-800 border-gray-200 hover:bg-gray-100",
              ].join(" ")}
            >
              <div className="text-xs font-semibold uppercase opacity-80">
                {d.format("ddd")}
              </div>
              <div className="text-lg font-bold leading-5">{d.format("D")}</div>
              <div className="text-xs font-medium opacity-80">
                {d.format("MMM")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
