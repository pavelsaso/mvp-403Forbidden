import org.springframework.web.bind.annotation.*;

@RestController
public class LocationController {

    @PostMapping("/event")
    public void recibir(@RequestBody UbicacionDTO data) {

        double lat = data.getLat();
        double lon = data.getLon();

        System.out.println(lat + ", " + lon);
    }
}