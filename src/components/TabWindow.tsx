import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, OpaqueColorValue, PanResponder, Pressable, StatusBar, StyleProp, Text, useAnimatedValue, useColorScheme, useWindowDimensions, View, ViewStyle } from "react-native";
import { useTheme } from "../contexts/useTheme";

interface TabWindowProps {
	minimizedState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>],
	hiddenState?: boolean,
	closeCallback?: () => void,
	children?: React.JSX.Element[] | React.JSX.Element | string | null,
	minimizedChildren?: React.JSX.Element[] | React.JSX.Element | string | null
}

export default function TabWindow({
	minimizedState = useState(true),
	hiddenState = false,
	closeCallback,
	children,
	minimizedChildren
}: TabWindowProps) {
	const { background, onBackground, surface, onSurface, secondary, onSecondary } = useTheme();

	const [minimized, setMinimized] = minimizedState;
	// const [modalHidden, setModalHidden] = hiddenState;
	const [windowPointerEvents, setWindowPointerEvents] = useState<"auto" | "box-only">("auto");

	const minimizedHeight = 150

	const [hasReleased, setHasReleased] = useState<boolean>(false);
	const [startPosition, setStartPosition] = useState<number | undefined>();
	const windowRef = useRef<View>(null);
	const slideAnim = useAnimatedValue(-minimizedHeight);

	function animateStatus() {
		const window = windowRef.current
		if (!window) return;

		slideAnim.flattenOffset();

		window.measure((x, y, width, height) => {
			if (hiddenState == true) {
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 400,
					useNativeDriver: true
				}).start()
				return
			}

			if (minimized == false) {
				Animated.timing(slideAnim, {
					toValue: -height,
					duration: 400,
					useNativeDriver: true
				}).start()
				return
			}

			Animated.timing(slideAnim, {
				toValue: -minimizedHeight,
				duration: 400,
				useNativeDriver: true
			}).start()
		})
	}

	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => false,
		onStartShouldSetPanResponderCapture: () => false,

		onMoveShouldSetPanResponder: (event, gestureState) => {
			const window = windowRef.current
			if (!window) return false;

			let shouldRespond = true;
			const pageY = event.nativeEvent.pageY;
			window.measure((x, y, width, height) => {
				if (minimized == false) {
					// Just ignore when swiping up and maximized
					if (gestureState.dy < 0) {
						shouldRespond = false
						return
					}

					if (pageY > height / 2.5) {
						shouldRespond = false
						return
					}

					if (
						(pageY > minimizedHeight && gestureState.dy < 40) ||
						(Math.abs(gestureState.dy) < 60)
					) {
						shouldRespond = false
					}
				}
			})

			return (Math.abs(gestureState.dy) > 10) && shouldRespond; // threshold to detect drag
		},
		onMoveShouldSetPanResponderCapture: () => false,

		onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
			const window = windowRef.current
			if (!window || hasReleased) return;
			const pageY = event.nativeEvent.pageY
			window.measure((x, y, width, height) => {
				if (startPosition == undefined) {
					setStartPosition(minimizedHeight - (height - pageY))
				}

				if (startPosition == undefined) return;
				const offsetY = minimized
					? height - (pageY - startPosition)
					: pageY - (startPosition - (minimizedHeight - height))

				const swipingUp = (gestureState.dy < -70 && gestureState.vy < -1.7) || offsetY >= (height - 100)
				if (minimized && swipingUp) {
					setHasReleased(true)
					setStartPosition(undefined)
					setMinimized(false)
				}

				const swipingDown = (gestureState.dy > 70 && gestureState.vy > 1.7) || offsetY - height >= -minimizedHeight
				if (!minimized && swipingDown) {
					setHasReleased(true)
					setStartPosition(undefined)
					setMinimized(true)
				}

				const offset = Math.max(
					0,
					Math.min(
						minimized
							? (offsetY - minimizedHeight)
							: offsetY,
						height - minimizedHeight
					)
				) * (minimized ? -1 : 1)

				slideAnim.setOffset(offset)
			})
		},
		onPanResponderRelease: () => {
			slideAnim.flattenOffset();
			setHasReleased(false)
			animateStatus()
			setStartPosition(undefined)
		}
	})

	useEffect(() => {
		animateStatus()

		// Reanimate window
		const subscription = Dimensions.addEventListener('change', animateStatus);

		return () => {
			subscription?.remove?.(); // clean up the listener
		};
	}, [minimized, hiddenState])

	return (
		<>
			<View style={{ backgroundColor: background, height: hiddenState ? 0 : (minimizedHeight - 18) }} />
			<Animated.View
				{...panResponder.panHandlers}
				ref={windowRef}
				style={{
					position: "absolute",
					top: "100%",
					left: 0,
					width: "100%",
					height: "100%",
					paddingTop: 16,
					zIndex: 2,
					backgroundColor: surface,
					borderTopLeftRadius: 20,
					borderTopRightRadius: 20,
					transform: [{ translateY: slideAnim }]
				}}
			>
				{minimized ? minimizedChildren : children}
			</Animated.View>
		</>
	)
}