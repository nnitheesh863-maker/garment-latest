const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

router.get("/", protect, employeeController.getEmployees);
router.get("/:id", protect, employeeController.getEmployee);
router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  employeeController.updateEmployee,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  employeeController.deleteEmployee,
);
router.get(
  "/:id/performance",
  protect,
  employeeController.getEmployeePerformance,
);
router.get("/:id/tasks", protect, employeeController.getEmployeeTasks);
router.post("/:id/attendance", protect, employeeController.markAttendance);
router.get("/:id/attendance", protect, employeeController.getAttendance);
router.post("/:id/issue", protect, employeeController.reportIssue);
router.post("/:id/issues", protect, employeeController.reportIssue);
router.get("/:id/issues", protect, employeeController.getEmployeeIssues);
router.get(
  "/issues/all",
  protect,
  authorize("admin", "manager"),
  employeeController.getAllIssues,
);

module.exports = router;
