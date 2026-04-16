export function createStatusColumn(options = {}) {
  const {
    activeKey = "is_active",
    label = "Status",
    activeLabel = "Active",
    inactiveLabel = "Inactive",
  } = options;

  return {
    key: activeKey,
    label,
    render: (value) => (
      <span
        className={
          value ? "text-green-600 font-bold" : "text-red-600 font-bold"
        }
      >
        {value ? activeLabel : inactiveLabel}
      </span>
    ),
  };
}
