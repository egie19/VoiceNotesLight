import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface Props {
  message: string;
  speed: number;
}

const AnimatedTyping = ({ message, speed }: Props) => {
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < message.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedMessage(message.substring(0, index + 1));
        setIndex(index + 1);
      }, speed);

      return () => clearTimeout(timeoutId); // Clear timeout if the component unmounts or message changes
    }
  }, [index, message, speed]);

  return (
    <View>
      <Text style={{ minWidth: 300, color: "#c5dbcb", fontWeight: "500" }}>
        Transcript Result:
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: "white",
          fontStyle: "italic",
          textAlign: "center",
          marginTop: 15,
        }}
      >
        {displayedMessage}
      </Text>
    </View>
  );
};

export default AnimatedTyping;
