export function createStatusField(options = {}) {
  const {
    name = "is_active",
    label = "Status",
    activeLabel = "Active",
    inactiveLabel = "Inactive",
  } = options;

  return {
    name,
    label,
    type: "select",
    options: [
      { value: "1", label: activeLabel },
      { value: "0", label: inactiveLabel },
    ],
  };
}
