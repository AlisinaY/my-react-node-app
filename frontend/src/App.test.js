// src/App.test.js
import "@testing-library/jest-dom";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from "@testing-library/react";
import App from "./App";

// Hilfsfunktion, um global.fetch zu mocken
const mockFetch = (status, body) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status === 200,
    status,
    json: async () => body
  });
};

describe("App Component", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("zeigt zunächst das Login-Formular", () => {
    mockFetch(401, {}); // checkLogin schlägt fehl
    render(<App />);
    expect(screen.getByRole("heading", { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Benutzername/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Passwort/i)).toBeInTheDocument();
  });

  test("wechselt zum Registrierungsformular", () => {
    mockFetch(401, {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Registrieren$/i }));
    expect(
      screen.getByRole("heading", { name: /Registrieren/i })
    ).toBeInTheDocument();
    // Zurück zum Login
    fireEvent.click(screen.getByRole("button", { name: /Zum Login/i }));
    expect(screen.getByRole("heading", { name: /Login/i })).toBeInTheDocument();
  });

  test("zeigt Produktliste nach erfolgreichem Login", async () => {
    // checkLogin beim Initial-Render: nicht eingeloggt
    mockFetch(401, []);
    render(<App />);

    // Login und anschließende Produkt-Abfrage mocken
    const products = [
      { _id: "1", name: "Prod A", price: 9.99, imagePath: "/img/a.png" },
      { _id: "2", name: "Prod B", price: 19.99, imagePath: "" }
    ];
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // login
      .mockResolvedValueOnce({ ok: true, json: async () => products }); // checkLogin

    // Login-Form ausfüllen und absenden
    fireEvent.change(screen.getByPlaceholderText(/Benutzername/i), {
      target: { value: "user1" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Passwort/i), {
      target: { value: "pass1" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^Login$/i }));

    // Warte auf Anzeige der Produkt-Überschrift
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Produkte/i })
      ).toBeInTheDocument()
    );

    // Prod A prüfen
    const prodAItem = screen.getByText("Prod A").closest("li");
    expect(prodAItem).toBeInTheDocument();
    expect(within(prodAItem).getByText(/9\.99/)).toBeInTheDocument();
    expect(within(prodAItem).getByAltText("Prod A")).toBeInTheDocument();

    // Prod B prüfen
    const prodBItem = screen.getByText("Prod B").closest("li");
    expect(prodBItem).toBeInTheDocument();
    expect(within(prodBItem).getByText(/19\.99/)).toBeInTheDocument();
    expect(within(prodBItem).queryByAltText("Prod B")).toBeNull();
  });

  test("Logout funktioniert und zeigt wieder Login-Formular", async () => {
    // Bereits eingeloggt mit einem Produkt
    const products = [{ _id: "1", name: "X", price: 1.23, imagePath: "" }];
    mockFetch(200, products);
    render(<App />);

    // Warte auf Produkt-Überschrift
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Produkte/i })
      ).toBeInTheDocument()
    );

    // Logout-Call mocken und ausführen
    global.fetch.mockResolvedValueOnce({ ok: true });
    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    // Danach sollte wieder das Login-Formular gezeigt werden
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Login/i })
      ).toBeInTheDocument()
    );
  });
});
