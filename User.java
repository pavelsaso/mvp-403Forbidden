import java.time.*;
import java.util.ArrayList;
import java.util.List;
public class User{
    private long  Timestamp;
    private String Zone;
    private double latitud;
    private double longitud;
    private void GenerateEvent(){
        this.Timestamp=LocalDateTime.now().getHour();

    }
    private long  GetTimeStamp(){
        return this.Timestamp;
    }
    private String  GetZone(){
        return this.Zone;
    }

    public List GetEvent(){
        List<Object> TimeaZone = new ArrayList<>();
        TimeaZone.add(GetTimeStamp());
        TimeaZone.add(GetZone());
        return TimeaZone;
    }
}