import { createTheme } from "@mui/material/styles";

const MAROON = "#59171B";
const MAROON_LIGHT = "#7A2328";
const MAROON_SOFT = "#A45A4A";
const CREAM = "#FED7B8";
const CREAM_LIGHT = "#FFF8F2";
const BORDER = "#F1D5C0";
const TEXT_PRIMARY = "#2C1A1A";
const TEXT_SECONDARY = "#7A6A63";
const SUCCESS = "#16A34A";
const WARNING = "#F59E0B";
const DANGER = "#DC2626";

const LIGHT = {
  primary: { main: MAROON, light: MAROON_SOFT, dark: "#3D0F12", contrastText: "#FFF8F2" },
  secondary: { main: MAROON_LIGHT, light: MAROON_SOFT, dark: MAROON, contrastText: "#FFF8F2" },
  accent: { main: CREAM, light: "#FFE8D4", dark: "#F5C4A0" },
  error: { main: DANGER },
  warning: { main: WARNING },
  info: { main: "#3B82F6" },
  success: { main: SUCCESS },
  background: { default: CREAM_LIGHT, paper: "#FFFFFF" },
  text: { primary: TEXT_PRIMARY, secondary: TEXT_SECONDARY },
  divider: BORDER,
  action: { hover: "rgba(89,23,27,0.04)", selected: "rgba(254,215,184,0.3)" },
};

const DARK = {
  primary: { main: "#C97468", light: "#E09A8C", dark: MAROON, contrastText: "#1A1012" },
  secondary: { main: CREAM, light: "#FFE8D4", dark: "#D4B098" },
  accent: { main: CREAM, light: "#FFE8D4", dark: "#D4B098" },
  error: { main: "#F06464" },
  warning: { main: "#FBBF24" },
  info: { main: "#7CB3FA" },
  success: { main: "#4ADE80" },
  background: { default: "#1A1012", paper: "#25171B" },
  text: { primary: "#F7E8DE", secondary: "#C4B0A4" },
  divider: "#3A262B",
  action: { hover: "rgba(254,215,184,0.06)", selected: "rgba(164,90,74,0.25)" },
};

const getDesignTokens = (mode) => {
  const palette = mode === "light" ? LIGHT : DARK;
  const isLight = mode === "light";

  return {
    palette: { mode, ...palette },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, fontSize: "2.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 },
      h2: { fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.01em", lineHeight: 1.2 },
      h3: { fontWeight: 700, fontSize: "1.6rem", lineHeight: 1.25 },
      h4: { fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25, letterSpacing: "-0.01em" },
      h5: { fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.3 },
      h6: { fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
      caption: { letterSpacing: "0.01em" },
    },
    shape: { borderRadius: 16 },
    shadows: [
      "none",
      isLight ? "0 1px 3px rgba(89,23,27,0.06), 0 1px 2px rgba(89,23,27,0.04)" : "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
      isLight ? "0 2px 8px rgba(89,23,27,0.07), 0 1px 3px rgba(89,23,27,0.05)" : "0 2px 8px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)",
      isLight ? "0 4px 14px rgba(89,23,27,0.08), 0 2px 4px rgba(89,23,27,0.04)" : "0 4px 14px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
      isLight ? "0 6px 20px rgba(89,23,27,0.09), 0 3px 6px rgba(89,23,27,0.05)" : "0 6px 20px rgba(0,0,0,0.55), 0 3px 6px rgba(0,0,0,0.35)",
      isLight ? "0 8px 28px rgba(89,23,27,0.1), 0 4px 8px rgba(89,23,27,0.06)" : "0 8px 28px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)",
      isLight ? "0 10px 34px rgba(89,23,27,0.12)" : "0 10px 34px rgba(0,0,0,0.62)",
      isLight ? "0 12px 40px rgba(89,23,27,0.14)" : "0 12px 40px rgba(0,0,0,0.65)",
      isLight ? "0 14px 46px rgba(89,23,27,0.16)" : "0 14px 46px rgba(0,0,0,0.68)",
      isLight ? "0 16px 52px rgba(89,23,27,0.18)" : "0 16px 52px rgba(0,0,0,0.7)",
      isLight ? "0 18px 58px rgba(89,23,27,0.2)" : "0 18px 58px rgba(0,0,0,0.72)",
      isLight ? "0 20px 64px rgba(89,23,27,0.22)" : "0 20px 64px rgba(0,0,0,0.74)",
      isLight ? "0 22px 70px rgba(89,23,27,0.24)" : "0 22px 70px rgba(0,0,0,0.76)",
      isLight ? "0 24px 76px rgba(89,23,27,0.26)" : "0 24px 76px rgba(0,0,0,0.78)",
      isLight ? "0 26px 82px rgba(89,23,27,0.28)" : "0 26px 82px rgba(0,0,0,0.8)",
      isLight ? "0 28px 88px rgba(89,23,27,0.3)" : "0 28px 88px rgba(0,0,0,0.82)",
      isLight ? "0 30px 94px rgba(89,23,27,0.32)" : "0 30px 94px rgba(0,0,0,0.84)",
      isLight ? "0 32px 100px rgba(89,23,27,0.34)" : "0 32px 100px rgba(0,0,0,0.86)",
      isLight ? "0 34px 106px rgba(89,23,27,0.36)" : "0 34px 106px rgba(0,0,0,0.88)",
      isLight ? "0 36px 112px rgba(89,23,27,0.38)" : "0 36px 112px rgba(0,0,0,0.9)",
      isLight ? "0 38px 118px rgba(89,23,27,0.4)" : "0 38px 118px rgba(0,0,0,0.92)",
      isLight ? "0 40px 124px rgba(89,23,27,0.42)" : "0 40px 124px rgba(0,0,0,0.94)",
      isLight ? "0 42px 130px rgba(89,23,27,0.44)" : "0 42px 130px rgba(0,0,0,0.96)",
      isLight ? "0 44px 136px rgba(89,23,27,0.46)" : "0 44px 136px rgba(0,0,0,0.98)",
      isLight ? "0 48px 160px rgba(89,23,27,0.5)" : "0 48px 160px rgba(0,0,0,1)",
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isLight ? CREAM_LIGHT : "#1A1012",
            transition: "background 400ms ease",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            position: "relative",
            overflow: "hidden",
            background: isLight ? "#FFFFFF" : "#25171B",
            border: isLight ? `1px solid ${BORDER}99` : "1px solid #3A262B",
            boxShadow: isLight ? "0 4px 24px rgba(89,23,27,0.06)" : "0 4px 24px rgba(0,0,0,0.35)",
            transition:
              "transform 320ms cubic-bezier(0.4,0,0.2,1), box-shadow 320ms cubic-bezier(0.4,0,0.2,1), border-color 320ms",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #59171B, #7A2328, #A45A4A, #FED7B8)",
              opacity: 0.75,
              zIndex: 1,
            },
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: isLight ? "0 18px 50px rgba(89,23,27,0.14)" : "0 18px 50px rgba(0,0,0,0.55)",
              borderColor: isLight ? "#E8C0A8" : "#4A3038",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            background: isLight ? "#FFFFFF" : "#25171B",
            borderRadius: 20,
          },
          rounded: { borderRadius: 20 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            padding: "10px 22px",
            fontSize: "0.875rem",
            fontWeight: 600,
            position: "relative",
            overflow: "hidden",
            transition: "all 240ms cubic-bezier(0.4,0,0.2,1)",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-120%",
              width: "60%",
              height: "100%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.3), transparent)",
              transform: "skewX(-20deg)",
              transition: "left 0.55s ease",
            },
            "&:hover::after": { left: "160%" },
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #59171B 0%, #7A2328 100%)",
            boxShadow: "0 8px 22px rgba(89,23,27,0.32)",
            color: "#FFF8F2",
            "&:hover": {
              background: "linear-gradient(135deg, #7A2328 0%, #A45A4A 100%)",
              boxShadow: "0 12px 30px rgba(122,35,40,0.45)",
              transform: "translateY(-2px)",
            },
          },
          containedSecondary: {
            background: "linear-gradient(135deg, #FED7B8, #FFE8D4)",
            color: MAROON,
            boxShadow: "0 4px 14px rgba(89,23,27,0.14)",
            "&:hover": {
              background: "linear-gradient(135deg, #FFE8D4, #FED7B8)",
              boxShadow: "0 8px 22px rgba(89,23,27,0.2)",
              transform: "translateY(-2px)",
            },
          },
          outlined: {
            borderColor: isLight ? BORDER : "#4A3038",
            color: isLight ? MAROON : "#E09A8C",
            "&:hover": {
              borderColor: MAROON_LIGHT,
              bgcolor: "rgba(89,23,27,0.04)",
              transform: "translateY(-1px)",
            },
          },
          text: {
            color: isLight ? MAROON : "#E09A8C",
            "&:hover": { bgcolor: "rgba(89,23,27,0.06)" },
          },
          sizeLarge: { padding: "12px 30px", fontSize: "0.95rem" },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: "all 240ms cubic-bezier(0.4,0,0.2,1)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 14,
              backgroundColor: isLight ? "rgba(255,248,242,0.6)" : "rgba(0,0,0,0.25)",
              transition: "all 240ms",
              "& fieldset": { borderColor: isLight ? BORDER : "#3A262B" },
              "&:hover fieldset": { borderColor: isLight ? "#E8C0A8" : "#5A3A44" },
              "&.Mui-focused fieldset": {
                borderColor: MAROON_LIGHT,
                borderWidth: 2,
                boxShadow: "0 0 0 4px rgba(122,35,40,0.12)",
              },
              "&.Mui-focused": {
                boxShadow: "0 4px 18px rgba(89,23,27,0.08)",
              },
            },
            "& .MuiInputLabel-root.Mui-focused": { color: MAROON_LIGHT },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: { borderRadius: 14 },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: { borderRadius: 16, border: `1px solid ${BORDER}66`, boxShadow: "0 12px 40px rgba(89,23,27,0.12)" },
          listbox: { padding: 8 },
          option: { borderRadius: 10, margin: "2px 4px" },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: isLight ? `1px solid ${BORDER}66` : "1px solid #3A262B",
            overflow: "hidden",
            backgroundColor: isLight ? "#FFFFFF" : "#25171B",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              fontWeight: 700,
              fontSize: "0.78rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backgroundColor: isLight ? "#FFF4EC" : "#301D23",
              color: isLight ? TEXT_PRIMARY : "#E5CFC4",
              borderBottom: isLight ? `2px solid ${BORDER}` : "2px solid #4A3038",
              whiteSpace: "nowrap",
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background 200ms ease",
            "&:nth-of-type(even)": {
              backgroundColor: isLight ? "rgba(254,215,184,0.12)" : "rgba(254,215,184,0.03)",
            },
            "&:hover": {
              backgroundColor: isLight ? "rgba(254,215,184,0.28) !important" : "rgba(164,90,74,0.14) !important",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isLight ? `${BORDER}77` : "#332024",
            fontSize: "0.85rem",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            fontSize: "0.72rem",
            height: 28,
            transition: "all 200ms ease",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            boxShadow: "0 24px 80px rgba(89,23,27,0.22)",
            border: isLight ? `1px solid ${BORDER}66` : "1px solid #3A262B",
            overflow: "hidden",
            background: isLight ? "#FFFFFF" : "#25171B",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1.15rem",
            fontWeight: 700,
            padding: "20px 24px 8px",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: isLight ? `1px solid ${BORDER}88` : "1px solid #3A262B",
            boxShadow: "0 16px 48px rgba(89,23,27,0.16)",
            background: isLight ? "#FFFFFF" : "#25171B",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: "2px 6px",
            transition: "all 160ms ease",
            "&:hover": { backgroundColor: isLight ? "rgba(254,215,184,0.35)" : "rgba(164,90,74,0.18)" },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? "#FFF4EC" : "#301D23",
            borderRadius: 14,
            padding: 4,
            minHeight: 46,
          },
          indicator: {
            display: "none",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            minHeight: 38,
            padding: "6px 16px",
            fontWeight: 600,
            transition: "all 200ms ease",
            "&.Mui-selected": {
              background: isLight ? "#FFFFFF" : "#3A262B",
              color: MAROON,
              boxShadow: "0 4px 14px rgba(89,23,27,0.14)",
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            "&.Mui-checked": {
              color: "#FFFFFF",
              "& + .MuiSwitch-track": {
                backgroundColor: MAROON_LIGHT,
                opacity: 1,
              },
            },
          },
          track: {
            borderRadius: 20,
            backgroundColor: isLight ? "#E8D5C8" : "#3A262B",
          },
          thumb: {
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 8,
            backgroundColor: isLight ? "#F1D5C0" : "#3A262B",
          },
          bar: {
            borderRadius: 8,
            background: "linear-gradient(90deg, #59171B, #A45A4A)",
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: MAROON_LIGHT,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: "0.72rem",
            fontWeight: 500,
            background: isLight ? "rgba(44,26,26,0.92)" : "rgba(247,232,222,0.94)",
            color: isLight ? "#FFF8F2" : "#2C1A1A",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          },
          arrow: {
            color: isLight ? "rgba(44,26,26,0.92)" : "rgba(247,232,222,0.94)",
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 700,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: "all 200ms ease",
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: { fontWeight: 600 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: "0 6px 20px rgba(89,23,27,0.08)",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? `${BORDER}99` : "#332024",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: "none",
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            overflow: "hidden",
            border: isLight ? `1px solid ${BORDER}88` : "1px solid #3A262B",
            boxShadow: "0 4px 16px rgba(89,23,27,0.05)",
            "&::before": { display: "none" },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { color: MAROON_LIGHT },
          thumb: { "&:hover": { boxShadow: "0 0 0 8px rgba(122,35,40,0.12)" } },
        },
      },
      MuiSpeedDial: {
        styleOverrides: {
          fab: { backgroundColor: MAROON_LIGHT, "&:hover": { backgroundColor: MAROON } },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            background: "linear-gradient(135deg, #59171B, #7A2328)",
            color: "#FFF8F2",
            boxShadow: "0 10px 28px rgba(89,23,27,0.4)",
            "&:hover": { background: "linear-gradient(135deg, #7A2328, #A45A4A)" },
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          },
        },
      },
    },
  };
};

export function createAppTheme(mode) {
  return createTheme(getDesignTokens(mode));
}
