import { render, screen } from "@testing-library/react";
import Joystick from "./joystick";

describe("Joystick component", () => {
  it("renders correctly", () => {
    render(
      <Joystick
        x={-0.5}
        y={0.5}
        originX={100}
        originY={150}
        radius={50}
        deadZoneThreshold={0.25}
      />
    );

    const container = screen.getByTestId("joystick-container");
    expect(container).toBeInTheDocument();
    expect(container.style.left).toBe("50px"); // OriginX - radius
    expect(container.style.top).toBe("100px"); // OriginY - radius
    expect(container.style.width).toBe("100px"); // 2 * radius
    expect(container.style.height).toBe("100px"); // 2 * radius

    const deadzone = screen.getByTestId("joystick-deadzone");
    expect(deadzone).toBeInTheDocument();
    expect(deadzone.style.width).toBe("25px"); // 2 * radius * threshold
    expect(deadzone.style.height).toBe("25px"); // 2 * radius * threshold

    const joystick = screen.getByTestId("joystick");
    expect(joystick).toBeInTheDocument();
    expect(joystick.style.left).toBe("25px"); // X * radius + radius
    expect(joystick.style.top).toBe("75px"); // Y * radius + radius
  });
});
